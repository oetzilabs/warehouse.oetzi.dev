import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { Effect } from "effect";
import { Resource } from "sst";
import { RealtimeInvalidPayloadError, RealtimePublishError } from "./errors";

export type RealtimeEvent<T extends string, A extends string, P = unknown> = {
  type: T;
  action: A;
  payload: P;
};

export type UnknownEvent = RealtimeEvent<"unknown", "unknown", any>;
export type OrganizationEvent = RealtimeEvent<"organization", "created" | "updated" | "deleted", string>;
export type WarehouseEvent = RealtimeEvent<"warehouse", "created" | "updated" | "deleted", string>;
export type FacilityEvent = RealtimeEvent<"facility", "created" | "updated" | "deleted", string>;
export type StorageEvent = RealtimeEvent<"storage", "created" | "updated" | "deleted", string>;
export type ProductEvent = RealtimeEvent<"product", "created" | "updated" | "deleted", string>;
export type SaleEvent = RealtimeEvent<"sale", "created" | "updated" | "deleted", string>;
export type OrderEvent = RealtimeEvent<"order", "created" | "updated" | "deleted", string>;
export type PrintEvent = RealtimeEvent<"print", "created" | "updated" | "deleted", string>;

export type RealtimeEvents =
  | UnknownEvent
  | OrganizationEvent
  | WarehouseEvent
  | FacilityEvent
  | StorageEvent
  | ProductEvent
  | SaleEvent
  | OrderEvent
  | PrintEvent;

export type RealtimeTopicPattern = `${string}/${string}/realtime/${RealtimeEvents["type"]}/${RealtimeEvents["action"]}`;

export class RealtimeService extends Effect.Service<RealtimeService>()("@warehouse/realtime", {
  effect: Effect.gen(function* (_) {
    const publish = <T extends string, A extends string, P>(
      client: string,
      type: T,
      action: A,
      payload: P,
    ): Effect.Effect<void, RealtimePublishError | RealtimeInvalidPayloadError> =>
      Effect.gen(function* (_) {
        const client = new IoTDataPlaneClient();
        if (!type || !action) {
          return yield* Effect.fail(
            new RealtimeInvalidPayloadError({
              message: "Type and action must be provided, but got " + type + ", " + action,
            }),
          );
        }

        const pl: RealtimeEvent<T, A, P> = { type, action, payload };
        const command = new PublishCommand({
          topic: `${Resource.App.name}/${Resource.App.stage}/${client}/realtime`,
          payload: Buffer.from(JSON.stringify(pl)),
          qos: 1,
        });

        const result = yield* Effect.tryPromise({
          try: () => client.send(command),
          catch: (error) =>
            new RealtimePublishError({
              message: "Failed to publish to MQTT",
              error: error,
            }),
        });
        return result;
      });

    const createTopics = (prefix: string, orgId: string) =>
      Effect.gen(function* (_) {
        return {
          subscribe: [`${prefix}${orgId}/realtime/#`],
          publish: [`${prefix}${orgId}/realtime/`],
        };
      });

    const forPrinter = (prefix: string, orgId: string) =>
      Effect.gen(function* (_) {
        return {
          subscribe: [`${prefix}${orgId}/realtime/#`],
          publish: [`${prefix}${orgId}/realtime/`],
        };
      });

    return {
      publish,
      createTopics,
      forPrinter,
    } as const;
  }),
}) {}

export const RealtimeLive = RealtimeService.Default;
