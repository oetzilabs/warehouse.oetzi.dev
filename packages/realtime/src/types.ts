import { Effect, Schema } from "effect";

export type RealtimeEventHandler<A, I, X> = {
  readonly channel: string;
  readonly schema: Schema.Schema<A, I>;
  readonly handle: (topic: string, params: Record<string, string>, data: A) => Effect.Effect<void, X, never>;
  readonly unsubscribe?: Effect.Effect<void, never, never>;
};

export type InfallibleEventHandler<A, I> = {
  [K in keyof RealtimeEventHandler<A, I, never>]: RealtimeEventHandler<A, I, never>[K];
};

export const createEventHandler = <A, I, X>(handler: RealtimeEventHandler<A, I, X>): InfallibleEventHandler<A, I> => ({
  channel: handler.channel,
  schema: handler.schema,
  handle: (topic, params, data) => handler.handle(topic, params, data).pipe(Effect.catchAllCause(() => Effect.void)),
  unsubscribe: handler.unsubscribe,
});

export const SubscriptionId = Schema.String.pipe(Schema.brand("SubscriptionId"));
export type SubscriptionId = typeof SubscriptionId.Type;
