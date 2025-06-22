import { withSession } from "@/lib/api/session";
import { CustomerOrderLive, CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationNotFound } from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { Effect, Layer } from "effect";

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
  const organizationId = Layer.succeed(OrganizationId, orgId);

  try {
    const result = await Effect.runPromise(
      Effect.gen(function* (_) {
        const orderService = yield* CustomerOrderService;
        const organizationService = yield* OrganizationService;
        const org = yield* organizationService.findById(orgId);
        const order = yield* orderService.findById(params.id);
        const pdf = yield* orderService.generatePDF(params.id, org, { page: { size: "A4", orientation: "portrait" } });

        return { pdf, filename: order.barcode ?? order.createdAt.toISOString() };
      }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(OrganizationLive), Effect.provide(organizationId)),
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
