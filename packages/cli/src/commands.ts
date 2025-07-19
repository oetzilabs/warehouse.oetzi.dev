import { Command } from "@effect/cli";
import { orgCommand } from "./org";

const command = Command.make("wh").pipe(Command.withSubcommands([orgCommand]));

export const cli = Command.run(command, {
  name: "Warehouse CLI",
  version: "0.0.1",
});
