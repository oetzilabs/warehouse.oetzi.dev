import { getAuthenticatedUser } from "@/lib/api/auth";
import { action, json, query, redirect } from "@solidjs/router";
import { CatalogCreateSchema, CatalogUpdateSchema } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { CatalogLive, CatalogService } from "@warehouseoetzidev/core/src/entities/catalogs";
import { SessionLive } from "@warehouseoetzidev/core/src/entities/sessions";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { withSession } from "./session";

export const getCatalogs = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user || !session.current_organization_id) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const catalogs = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.findByOrganizationId(session.current_organization_id!);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return catalogs;
}, "organization-catalogs");

export const getCatalogById = query(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.findById(id);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return catalog;
}, "catalog-by-id");

export const createCatalog = action(async (data: InferInput<typeof CatalogCreateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const [user, session] = auth;
  if (!session.current_organization_id) {
    throw new Error("You have to be part of an organization to perform this action.");
  }

  const catalog = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CatalogService);
      return yield* service.create(data, session.current_organization_id!, user.id);
    }).pipe(Effect.provide(CatalogLive)),
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
      return yield* service.remove(id);
    }).pipe(Effect.provide(CatalogLive)),
  );
  return catalog;
});
