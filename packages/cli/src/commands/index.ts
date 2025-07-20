import { Command } from "@effect/cli";
import { orgCommand } from "./organization";

export const command = Command.make("wh");
export const commands = [orgCommand] as const;
