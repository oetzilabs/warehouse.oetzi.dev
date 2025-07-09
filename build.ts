import { BunRuntime } from "@effect/platform-bun";
import { program } from "@warehouseoetzidev/build";

if (import.meta.path === Bun.main) {
  BunRuntime.runMain(
    program([
      {
        id: "@warehouseoetzidev/web",
        entrypoint: "@warehouseoetzidev/web",
        dependsOn: [],
        outputs: [".output", ".vinxi"],
      },
      {
        id: "@warehouseoetzidev/realtime/server",
        entrypoint: "@warehouseoetzidev/realtime",
        command: "bun build ./src/server/index.ts --compile --outfile=.output/server/main",
        dependsOn: [],
        outputs: [".output/server"],
      },
      {
        id: "@warehouseoetzidev/realtime/client",
        entrypoint: "@warehouseoetzidev/realtime",
        command: "bun build ./src/client/index.ts --compile --outfile=.output/client/main",
        dependsOn: [],
        outputs: [".output/client"],
      },
    ]),
  );
} else {
  console.log("we currently don't support building in a non-main context");
}
