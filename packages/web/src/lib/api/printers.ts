import { action, json, query, redirect } from "@solidjs/router";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const testPrint = action(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const program = Effect.gen(function* (_) {
    // TODO: Implement a way to connect to the printer and send a print job.
    // Preferably, we should use a NetworkManager to handle the connection and send the job.
    // This will allow us to handle the connection in a more robust way, and also handle errors.
    // Reason for a NetworkManager is that no matter where the printer is located (remote or local), the NM should be able to find the printer across the network.
    // Since the web application will run on several environments (lambda, docker, plain node/bun), we should be able to use the same code to handle the connection.
    // In the meantime, we can just return an empty object.
    return yield* Effect.succeed({});
  });

  const productExit = await Effect.runPromiseExit(Effect.scoped(program));

  return Exit.match(productExit, {
    onSuccess: (prods) => {
      return json(prods);
    },
    onFailure: (cause) => {
      // console.log(cause);
      // const causes = Cause.failures(cause);
      // const errors = Chunk.toReadonlyArray(causes).map((c) => {
      //   return c.message;
      // });
      // throw redirect(`/error?message=${encodeURI(errors.join(", "))}&function=unknown`, {
      //    status: 500,
      //    statusText: `Internal Server Error: ${errors.join(", ")}`,
      // });
    },
  });
});
