import { getAuthenticatedUser } from "@/lib/api/auth";
import { action, json, query, redirect } from "@solidjs/router";
import { CatalogCreateSchema, CatalogUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { CatalogLive, CatalogService } from "@warehouseoetzidev/core/src/entities/catalogs";
import { CatalogNotFound } from "@warehouseoetzidev/core/src/entities/catalogs/errors";
import { DeviceLive, DeviceService } from "@warehouseoetzidev/core/src/entities/devices";
import { DeviceNotFound } from "@warehouseoetzidev/core/src/entities/devices/errors";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductNotFound } from "@warehouseoetzidev/core/src/entities/products/errors";
import { SessionLive } from "@warehouseoetzidev/core/src/entities/sessions";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { InferInput } from "valibot";
import { withSession } from "./session";

export const getCatalogs = query(async () => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const catalogs = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.findAll();
    }).pipe(Effect.provide(CatalogLive), Effect.provide(organizationId)),
  );
  return catalogs;
}, "organization-catalogs");

export const getCatalogById = query(async (id: string) => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(CatalogLive), Effect.provide(organizationId)),
  );
  return catalog;
}, "catalog-by-id");

export const createCatalog = action(async (data: InferInput<typeof CatalogCreateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw new Error("You have to be logged in to perform this action.");
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
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.create(data, user.id);
    }).pipe(Effect.provide(CatalogLive), Effect.provide(organizationId)),
  );
  return json(catalog, {
    revalidate: [getAuthenticatedUser.key, getCatalogs.key],
    headers: {
      Location: `/catalogs/${catalog.id}`,
    },
    status: 303,
  });
});

export const updateCatalog = action(async (data: InferInput<typeof CatalogUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.update(data);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return catalog;
});

export const deleteCatalog = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return catalog;
});

export const printSheet = action(async (id: string, deviceId: string, productId: string) => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const catalogService = yield* _(CatalogService);
      const deviceService = yield* _(DeviceService);
      const productService = yield* _(ProductService);
      const device = yield* deviceService.findById(deviceId);
      const product = yield* productService.findById(productId);
      return yield* catalogService.printSheet(id, deviceId, productId);
    }).pipe(
      Effect.provide(CatalogLive),
      Effect.provide(DeviceLive),
      Effect.provide(ProductLive),
      Effect.provide(organizationId),
    ),
  );
  return catalog;
});

export const downloadSheet = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const catalogExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.downloadSheet(id);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return Exit.match(catalogExit, {
    onSuccess: (data) => {
      return new Response(data.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${data.name}-catalog.pdf"`,
        },
      });
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw redirect(`/error?message=${encodeURI(errors.join(", "))}&function=unknown`, {
        status: 500,
        statusText: `Internal Server Error: ${errors.join(", ")}`,
      });
    },
  });
});

export const addProductsToCatalog = action(async (id: string, products: string[]) => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);
  const result = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      const catalog = yield* service.findById(id);
      const prods = yield* service.getProducts(catalog.id);
      const toAdd = products.filter((p) => !prods.map((pp) => pp.id).includes(p));
      for (const product of toAdd) {
        yield* service.addProduct(catalog.id, product);
      }
      const productsToRemove = prods.map((pp) => pp.id).filter((p) => !products.includes(p));
      for (const product of productsToRemove) {
        yield* service.removeProduct(catalog.id, product);
      }
      return true;
    }).pipe(Effect.provide(CatalogLive), Effect.provide(organizationId)),
  );
  return json(result, {
    revalidate: [getCatalogById.keyFor(id), getCatalogs.key],
  });
});
