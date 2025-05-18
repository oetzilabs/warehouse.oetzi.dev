import { query, redirect } from "@solidjs/router";
import { MessageLive, MessageService } from "@warehouseoetzidev/core/src/entities/messages";
import { Effect } from "effect";
import { withSession } from "./session";

export const getMessages = query(async () => {
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

  const messages = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(MessageService);
      if (!session.current_organization_id) {
        throw new Error("You have to be part of an organization to perform this action.");
      }
      return yield* service.findByOrganizationId(session.current_organization_id);
    }).pipe(Effect.provide(MessageLive)),
  );
  return messages;
}, "Documentstorage-by-id");
