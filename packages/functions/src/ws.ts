import { WebsocketLive, WebsocketService } from "@warehouseoetzidev/core/src/entities/websocket";
import { Effect } from "effect";
import { StatusCodes } from "http-status-codes";
import { ApiHandler, error, json, WebSocketApiHandler } from "./utils";

export const connect = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);

  const x = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      return service.connect(connectionId);
    }).pipe(Effect.provide(WebsocketLive)),
  );
  return json(x);
});

export const disconnect = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const x = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      return service.disconnect(connectionId);
    }).pipe(Effect.provide(WebsocketLive)),
  );
  return json(x);
});

export const ping = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const payload_wrapper = JSON.parse(event.body || "{payload: {}}");
  // console.log("payload_wrapper", payload_wrapper);
  if (!payload_wrapper.payload) return error("No payload", StatusCodes.BAD_REQUEST);
  const payload = payload_wrapper.payload;
  const userId = payload.userId;
  if (!userId) return error("No userId", StatusCodes.BAD_REQUEST);
  const x = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      const updated = yield* service.update(connectionId, userId);
      const sentAt = new Date();
      const sent = yield* service.sendMessageToConnection(
        {
          action: "pong",
          payload: {
            recievedId: payload.id,
            sentAt,
          },
        },
        connectionId,
      );
      return { updated, sent, sentAt };
    }).pipe(Effect.provide(WebsocketLive)),
  );

  // const missingNotifications = await Notifications.sendMissingNotifications(userId);
  // console.log("missingNotifications", missingNotifications);
  return json({
    action: "pong",
    payload: {
      recievedId: x.updated.id,
      sentAt: x.sentAt,
    },
  });
});

export const main = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);
  const payload = JSON.parse(event.body || "{}");
  if (!payload.userId) return error("No userId", StatusCodes.BAD_REQUEST);
  const userId = payload.userId;
  const x = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      return yield* service.update(connectionId, userId);
    }).pipe(Effect.provide(WebsocketLive)),
  );
  return json(x);
});

export const sendnotification = WebSocketApiHandler(async (event) => {
  const connectionId = event.requestContext.requestId;
  if (!connectionId) return error("No connectionId", StatusCodes.BAD_REQUEST);

  const x = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      return yield* service.broadcast({
        action: "message",
        payload: {
          id: "test-user-notification",
          type: "user:info",
          title: "Test",
          content: "Test",
          dismissedAt: null,
        },
      });
    }).pipe(Effect.provide(WebsocketLive)),
  );

  return json(x);
});

export const revokeWebsocketConnections = ApiHandler(async (event, context) => {
  const revoked = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WebsocketService);
      return yield* service.revokeAll();
    }).pipe(Effect.provide(WebsocketLive)),
  );
  const revokedConnections = [];
  for (const connection of revoked) {
    revokedConnections.push({ id: connection.id, userId: connection.userId });
  }
  return json({ revoked: revokedConnections });
});
