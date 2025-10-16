import { Effect } from "effect";
import { Action } from ".";

export type DiscoverPayload = {};

export class DiscoverAction extends Action<"discover", DiscoverPayload> {
  constructor(id: string) {
    super("discover", id);
  }

  public run = Effect.fn("@warehouse/devices/actions/discover.run")(function* (payload: DiscoverPayload) {
    return true;
  });

  public fromJson = Effect.fn("@warehouse/devices/actions/discover.fromJson")(function* (json: any) {
    return new DiscoverAction(json.id);
  });
}
