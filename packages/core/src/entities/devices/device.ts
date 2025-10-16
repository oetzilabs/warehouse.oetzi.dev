import { Effect, Ref } from "effect";
import { ActionPayload, ActionType } from "./actions";
import { DeviceFailedToConnect } from "./errors";

export const device = Effect.fn("@warehouse/devices/device")(function* (connection_string: string) {
  const connection = yield* Ref.make<any>(null);

  const sendAction = Effect.fn("@warehouse/devices/device/sendAction")(function* <
    AT extends ActionType,
    Payload extends ActionPayload<AT>,
  >(action_type: AT, payload?: Payload) {
    const con = yield* Ref.get(connection);
    if (!con) {
      return yield* Effect.fail(new DeviceFailedToConnect({ connection_string }));
    }
    // const result = yield* con.sendAction(action_id, payload);
    // return result;
    return [] as string[];
  });

  return {
    sendAction,
  } as const;
});
