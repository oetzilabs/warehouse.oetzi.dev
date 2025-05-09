import { query, redirect } from "@solidjs/router";
import {
  DocumentStorageOfferLive,
  DocumentStorageOfferService,
} from "@warehouseoetzidev/core/src/entities/document_storage_offers";
import { Effect } from "effect";
import { withSession } from "./session";

export const getOffers = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const offers = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageOfferService);
      return yield* service.all();
    }).pipe(Effect.provide(DocumentStorageOfferLive)),
  );
  return offers;
}, "offers");
