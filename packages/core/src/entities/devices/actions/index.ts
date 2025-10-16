import { Effect } from "effect";
import { DiscoverAction } from "./discover";
import { LogAction } from "./log";
import { PrintAction } from "./print";

export abstract class Action<T, Payload> {
  public id: string;
  private type: T;

  constructor(type: T, id: string) {
    this.type = type;
    this.id = id;
  }

  public abstract run(payload: Payload): Effect.Effect<any, any, any>;
  public abstract fromJson(json: any): Effect.Effect<Action<T, Payload>, any, any>;

  public toJSON() {
    return {
      id: this.id,
      type: this.type,
    };
  }
}

export const AllActions = {
  discover: DiscoverAction,
  log: LogAction,
  print: PrintAction,
} as const;
export type AllActions = typeof AllActions;
export type ActionType = keyof AllActions;
// get the payload from the run function
export type ActionPayload<Key extends keyof AllActions> = Parameters<AllActions[Key]["prototype"]["run"]>[0];
