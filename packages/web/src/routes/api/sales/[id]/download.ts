import { withSession } from "@/lib/api/session";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationNotFound } from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { Console, Effect } from "effect";

export async function GET({ params }: { params: { id: string } }) {
  const auth = await withSession();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }
  const [user, session] = auth;
  if (!user || !session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await Effect.runPromise(
    Effect.gen(function* (_) {
      const saleService = yield* _(SalesService);
      const organizationService = yield* _(OrganizationService);
      const org = yield* organizationService.findById(orgId);
      const sale = yield* saleService.findById(params.id, org.id);
      const pdf = yield* saleService.generatePDF(params.id, org, { page: { size: "A4", orientation: "portrait" } });
      return { pdf, filename: sale.barcode ?? sale.createdAt.toISOString() };
    }).pipe(Effect.provide(SalesLive), Effect.provide(OrganizationLive)),
  );

  return new Response(result.pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}.pdf"`,
    },
  });
}
