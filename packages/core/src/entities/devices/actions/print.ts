import { Effect } from "effect";
import { Action } from ".";

export type PrintPayload = {
  content: string;
};

export class PrintAction extends Action<"print", PrintPayload> {
  constructor(id: string) {
    super("print", id);
  }

  public run = Effect.fn("@warehouse/devices/actions/print.run")(function* (payload: PrintPayload) {
    return true;
  });

  public fromJson = Effect.fn("@warehouse/devices/actions/print.fromJson")(function* (json: any) {
    return new PrintAction(json.id);
  });
}
