import { getAuthenticatedUser } from "@/lib/api/auth";
import { action, json, query } from "@solidjs/router";
import { CatalogCreateSchema, CatalogUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import {
  CatalogAllFromOrganizationInfo,
  CatalogLive,
  CatalogService,
} from "@warehouseoetzidev/core/src/entities/catalogs";
import { NewCatalogFormData } from "@warehouseoetzidev/core/src/entities/catalogs/schemas";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { run, runWithSession } from "./utils";

export const getCatalogs = query(() => {
  "use server";
  return run(
    "@query/catalogs",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
      const catalogs = yield* service.findAll();
      return json(catalogs);
    }).pipe(Effect.provide(CatalogLive)),
    json([] as CatalogAllFromOrganizationInfo[]),
  );
}, "organization-catalogs");

export const getCatalogById = query((id: string) => {
  "use server";
  return run(
    "@query/catalog-by-id",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
      const catalog = yield* service.findById(id);
      return json(catalog);
    }).pipe(Effect.provide(CatalogLive)),
    (errors) => json(errors),
  );
}, "catalog-by-id");

export const createCatalog = action((data: NewCatalogFormData) => {
  "use server";
  return runWithSession(
    "@action/create-catalog",
    Effect.fn(
      function* (session) {
        const service = yield* CatalogService;
        const result = yield* service.create(data, session.user_id);
        const productsAdded = yield* Effect.all(
          data.products.map((p) => service.addProduct(result.id, p.id, p.discount)),
        );
        return json(result, {
          revalidate: [getAuthenticatedUser.key, getCatalogs.key],
          headers: {
            Location: `/catalogs/${result.id}`,
          },
          status: 303,
        });
      },
      (effect) => effect.pipe(Effect.provide(CatalogLive)),
    ),
    (errors) =>
      json(errors, {
        revalidate: [getAuthenticatedUser.key, getCatalogs.key],
      }),
  );
});

export const updateCatalog = action((data: InferInput<typeof CatalogUpdateSchema>) => {
  "use server";
  return run(
    "@action/update-catalog",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
      const catalog = yield* service.update(data);
      return json(catalog, {
        revalidate: [getAuthenticatedUser.key, getCatalogs.key, getCatalogById.keyFor(catalog.id)],
      });
    }).pipe(Effect.provide(CatalogLive)),
    (errors) =>
      json(errors, {
        revalidate: [getAuthenticatedUser.key, getCatalogs.key, getCatalogById.key],
      }),
  );
});

export const deleteCatalog = action((id: string) => {
  "use server";
  return run(
    "@action/delete-catalog",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
      const catalog = yield* service.safeRemove(id);
      return json(catalog, {
        revalidate: [getAuthenticatedUser.key, getCatalogs.key, getCatalogById.keyFor(catalog.id)],
        headers: {
          Location: `/catalogs/`,
        },
      });
    }).pipe(Effect.provide(CatalogLive)),
    (errors) =>
      json(errors, {
        revalidate: [getAuthenticatedUser.key, getCatalogs.key, getCatalogById.key],
      }),
  );
});

export const printSheet = action((id: string, deviceId: string, productId: string) => {
  "use server";
  return run(
    "@action/print-sheet",
    Effect.gen(function* (_) {
      const catalogService = yield* CatalogService;
      return yield* catalogService.printSheet(id, deviceId, productId);
    }).pipe(Effect.provide(CatalogLive)),
    (errors) =>
      json(errors, {
        revalidate: [getCatalogById.keyFor(id), getCatalogs.key],
      }),
  );
});

export const downloadSheet = action((id: string) => {
  "use server";
  return run(
    "@action/download-sheet",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
      const data = yield* service.downloadSheet(id);
      return new Response(data.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${data.name}-catalog.pdf"`,
        },
      });
    }).pipe(Effect.provide(CatalogLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCatalogs.key, getCatalogById.key],
    }),
  );
});

export const addProductsToCatalog = action((id: string, products: string[]) => {
  "use server";
  return run(
    "@action/add-products-to-catalog",
    Effect.gen(function* (_) {
      const service = yield* CatalogService;
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
      return json(true, {
        revalidate: [getCatalogById.keyFor(id), getCatalogs.key],
      });
    }).pipe(Effect.provide(CatalogLive)),
    (errors) =>
      json(errors, {
        revalidate: [getCatalogById.keyFor(id), getCatalogs.key],
      }),
  );
});
