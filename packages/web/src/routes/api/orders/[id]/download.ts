import { withSession } from "@/lib/api/session";
import { CustomerOrderLive, CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationNotFound } from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { Effect } from "effect";

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

  try {
    const result = await Effect.runPromise(
      Effect.gen(function* (_) {
        const orderService = yield* _(CustomerOrderService);
        const order = yield* _(orderService.findById(params.id));
        const organizationService = yield* _(OrganizationService);
        const org = yield* _(organizationService.findById(orgId));
        if (!org) {
          return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
        }
        const pdf = yield* _(
          orderService.generatePDF(params.id, org, { page: { size: "A4", orientation: "portrait" } }),
        );
        return { pdf, filename: order.barcode ?? order.createdAt.toISOString() };
      }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(OrganizationLive)),
    );

    return new Response(result.pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
