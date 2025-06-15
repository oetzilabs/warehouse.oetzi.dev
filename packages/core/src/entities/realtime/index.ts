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
      type: T,
      action: A,
      payload: P,
    ): Effect.Effect<void, RealtimePublishError | RealtimeInvalidPayloadError> =>
      Effect.gen(function* (_) {
        const client = new IoTDataPlaneClient();
        if (!type || !action) {
          return yield* Effect.fail(
            new RealtimeInvalidPayloadError({
              message: "Type and action must be provided",
            }),
          );
        }

        const pl: RealtimeEvent<T, A, P> = { type, action, payload };
        const command = new PublishCommand({
          topic: `${Resource.App.name}/${Resource.App.stage}/realtime`,
          payload: Buffer.from(JSON.stringify(pl)),
          qos: 1,
        });

        try {
          yield* Effect.promise(() => client.send(command));
        } catch (error) {
          return yield* Effect.fail(
            new RealtimePublishError({
              message: "Failed to publish to MQTT",
              error,
            }),
          );
        }
      });

    const createTopics = (prefix: string, orgId: string) =>
      Effect.gen(function* (_) {
        const base = `${prefix}/${orgId}`;

        const topics = {
          organization: {
            subscribe: [`${base}/organization/*`] as const,
            publish: [
              `${base}/organization/created`,
              `${base}/organization/updated`,
              `${base}/organization/deleted`,
            ] as const,
          },
          warehouse: {
            subscribe: [`${base}/warehouse/*`] as const,
            publish: [`${base}/warehouse/created`, `${base}/warehouse/updated`, `${base}/warehouse/deleted`] as const,
          },
          facility: {
            subscribe: [`${base}/facility/*`] as const,
            publish: [`${base}/facility/created`, `${base}/facility/updated`, `${base}/facility/deleted`] as const,
          },
          storage: {
            subscribe: [`${base}/storage/*`] as const,
            publish: [`${base}/storage/created`, `${base}/storage/updated`, `${base}/storage/deleted`] as const,
          },
          product: {
            subscribe: [`${base}/product/*`] as const,
            publish: [`${base}/product/created`, `${base}/product/updated`, `${base}/product/deleted`] as const,
          },
          sale: {
            subscribe: [`${base}/sale/*`] as const,
            publish: [`${base}/sale/created`, `${base}/sale/updated`, `${base}/sale/deleted`] as const,
          },
          order: {
            subscribe: [`${base}/order/*`] as const,
            publish: [`${base}/order/created`, `${base}/order/updated`, `${base}/order/deleted`] as const,
          },
          print: {
            subscribe: [`${base}/print/*`] as const,
            publish: [`${base}/print/created`, `${base}/print/updated`, `${base}/print/deleted`] as const,
          },
        } as const;

        return {
          subscribe: Object.values(topics).flatMap((t) => t.subscribe),
          publish: Object.values(topics).flatMap((t) => t.publish),
        } as const;
      });

    const forPrinter = (prefix: string, orgId: string) =>
      Effect.gen(function* (_) {
        const base = `${prefix}/${orgId}`;
        return {
          subscribe: [`${base}/print/*`] as const,
          publish: [`${base}/print/created`, `${base}/print/updated`, `${base}/print/deleted`] as const,
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
