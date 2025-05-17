import { query, redirect } from "@solidjs/router";
import { DocumentLive, DocumentService } from "@warehouseoetzidev/core/src/entities/documents";
import { Effect } from "effect";
import { withSession } from "./session";

export const getDocuments = query(async () => {
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

  const Documentstorage = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentService);
      if (!session.current_organization_id) {
        throw new Error("You have to be part of an organization to perform this action.");
      }
      return yield* service.findByOrganizationId(session.current_organization_id);
    }).pipe(Effect.provide(DocumentLive)),
  );
  return Documentstorage;
}, "Documentstorage-by-id");
