import { Command } from "@effect/platform";
import { Effect } from "effect";
import { Action } from ".";
import { cmdExec } from "../../cmd";

export type LogPayload = {
  filter?: string;
};

export class LogAction extends Action<"log", LogPayload> {
  constructor(id: string) {
    super("log", id);
  }

  public run = Effect.fn("@warehouse/devices/actions/log.run")(function* (payload: LogPayload) {
    // get local logs from the device (linux)
    const command_string = `journalctl -u ${payload.filter}`;
    const cmd = Command.make(command_string);
    const p = yield* cmdExec(cmd);
    const results = p.stdout as string[];
    return results;
  });

  public fromJson = Effect.fn("@warehouse/devices/actions/log.fromJson")(function* (json: any) {
    return new LogAction(json.id);
  });
}
