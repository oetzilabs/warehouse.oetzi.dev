// import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
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
export type PingEvent = RealtimeEvent<"ping", "ignore", string>;

export type RealtimeEvents =
  | UnknownEvent
  | OrganizationEvent
  | WarehouseEvent
  | FacilityEvent
  | StorageEvent
  | ProductEvent
  | SaleEvent
  | OrderEvent
  | PrintEvent
  | PingEvent;

export type RealtimeTopicPattern = `${string}/${string}/realtime/${RealtimeEvents["type"]}/${RealtimeEvents["action"]}`;

export class RealtimeService extends Effect.Service<RealtimeService>()("@warehouse/realtime", {
  effect: Effect.gen(function* (_) {
    const createTopics = Effect.fn("@warehouse/realtime/createTopics")(function* (prefix: string, orgId: string) {
      return {
        subscribe: [`${prefix}${orgId}/realtime/#`],
        publish: [`${prefix}${orgId}/realtime/`],
      };
    });

    const forPrinter = Effect.fn("@warehouse/realtime/forPrinter")(function* (prefix: string, orgId: string) {
      return {
        subscribe: [`${prefix}${orgId}/realtime/#`],
        publish: [`${prefix}${orgId}/realtime/`],
      };
    });

    return {
      createTopics,
      forPrinter,
    } as const;
  }),
}) {}

export const RealtimeLive = RealtimeService.Default;
