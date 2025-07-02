import { ApiGatewayManagementApi, GoneException } from "@aws-sdk/client-apigatewaymanagementapi";
import dayjs from "dayjs";
import { eq, gte } from "drizzle-orm";
import { Effect } from "effect";
import { Resource } from "sst";
import { safeParse } from "valibot";
import { TB_websockets } from "../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../drizzle/sql/service";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";
import { WebsocketMessage } from "../utils/websocket";
import { OrganizationService } from "./organizations";

export class WebsocketService extends Effect.Service<WebsocketService>()("@warehouse/websocket", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;
    const apiG = new ApiGatewayManagementApi({
      endpoint: Resource.websocket_api.managementEndpoint,
    });

    const sendMessageToConnection = (message: WebsocketMessage, connectionId: string) =>
      Effect.tryPromise({
        try: () =>
          apiG.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message),
          }),
        catch: (e: unknown) => {
          const eTyped = e as { statusCode: number };
          if (eTyped.statusCode === 410 || eTyped instanceof GoneException) {
            return db.delete(TB_websockets).where(eq(TB_websockets.connectionId, connectionId)).returning();
          }
          return Effect.fail(e);
        },
      });

    const connect = (connectionId: string) => db.insert(TB_websockets).values({ connectionId }).returning();

    const disconnect = (connectionId: string) =>
      db.delete(TB_websockets).where(eq(TB_websockets.connectionId, connectionId)).returning();

    const getConnections = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID"));
        }

        return yield* db
          .select({ connectionId: TB_websockets.connectionId })
          .from(TB_websockets)
          .where(eq(TB_websockets.userId, parsedId.output));
      });

    const update = (connectionId: string, userId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID"));
        }

        const [x] = yield* db
          .update(TB_websockets)
          .set({ updatedAt: new Date(), userId: parsedId.output })
          .where(eq(TB_websockets.connectionId, connectionId))
          .returning();
        return x;
      });

    const sendMessageToUsersInOrganization = (organization_id: string, message: WebsocketMessage) =>
      Effect.gen(function* (_) {
        const service = yield* _(OrganizationService);
        const org = yield* service.findById(organization_id);
        if (!org) {
          return yield* Effect.fail(new Error("Organization not found"));
        }
        const users = org.users.map((user) => user.user);
        if (!users) {
          return yield* Effect.fail(new Error("No users in organization"));
        }

        for (let i = 0; i < users.length; i++) {
          const connections = yield* getConnections(users[i].id);
          if (connections.length === 0) continue;
          for (let j = 0; j < connections.length; j++) {
            const connection = connections[j];
            yield* sendMessageToConnection(message, connection.connectionId);
          }
        }
        return users;
      });

    const broadcast = (message: WebsocketMessage) =>
      Effect.gen(function* (_) {
        const connectionIds = yield* db
          .select({ connectionId: TB_websockets.connectionId })
          .from(TB_websockets)
          .where(gte(TB_websockets.updatedAt, dayjs().subtract(5, "minute").toDate()));

        const results = yield* Effect.all(
          connectionIds.map((conn) => sendMessageToConnection(message, conn.connectionId)),
        );

        return results;
      });

    const revoke = (connectionId: string) =>
      Effect.gen(function* (_) {
        const entries = yield* db.delete(TB_websockets).where(eq(TB_websockets.connectionId, connectionId)).returning();
        if (entries.length === 0) {
          return yield* Effect.fail(new Error("Failed to revoke connection"));
        }

        return entries[0];
      });

    const revokeAll = () =>
      Effect.gen(function* (_) {
        const entries = yield* db.delete(TB_websockets).returning();

        if (entries.length === 0) {
          return yield* Effect.fail(new Error("Failed to revoke all connections"));
        }

        return entries;
      });

    return {
      connect,
      disconnect,
      getConnections,
      update,
      sendMessageToUsersInOrganization,
      sendMessageToConnection,
      broadcast,
      revoke,
      revokeAll,
    } as const;
  }),
  dependencies: [OrganizationService.Default, DatabaseLive],
}) {}

export const WebsocketLive = WebsocketService.Default;
