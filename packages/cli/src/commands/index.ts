import { Command } from "@effect/cli";
import { deviceCommand } from "./device";
import { orgCommand } from "./organization";
import { orgArg } from "./shared";

export const command = Command.make("wh", { org: orgArg });
export const commands = [orgCommand, deviceCommand] as const;
