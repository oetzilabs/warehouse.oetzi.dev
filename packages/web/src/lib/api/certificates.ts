import { query, redirect } from "@solidjs/router";
import { CertificateLive, CertificateService } from "@warehouseoetzidev/core/src/entities/certificates";
import { Effect } from "effect";
import { withSession } from "./session";

export const getCertificates = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const certificates = await Effect.runPromise(
    Effect.gen(function* (_) {
      const certificatesService = yield* _(CertificateService);
      const certificates = yield* certificatesService.all();
      return certificates;
    }).pipe(Effect.provide(CertificateLive)),
  );
  return certificates;
}, "certificates");
