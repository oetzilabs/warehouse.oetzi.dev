import { action, json, query, redirect, revalidate } from "@solidjs/router";
import {
  StorageConditionCreate,
  StorageConditionUpdate,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/storages/storage_conditions";
import {
  StorageConditionLive,
  StorageConditionService,
} from "@warehouseoetzidev/core/src/entities/storages/conditions";
import { StorageConditionNotFound } from "@warehouseoetzidev/core/src/entities/storages/errors";
import { Effect } from "effect";
import { withSession } from "./session";

export const getStorageConditions = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user || !session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const conditions = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(StorageConditionService);
      return yield* _(service.findAll());
    }).pipe(Effect.provide(StorageConditionLive)),
  );
  return conditions;
}, "storage-conditions");

export const createStorageCondition = action(async (input: StorageConditionCreate) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user || !session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const conditions = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(StorageConditionService);
      return yield* service.create(input);
    }).pipe(Effect.provide(StorageConditionLive)),
  );
  return json(conditions, {
    revalidate: [getStorageConditions.key],
  });
});

export const updateStorageCondition = action(async (id: string, input: StorageConditionUpdate) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user || !session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const conditions = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(StorageConditionService);
      const c = yield* service.findById(id);
      if (!c) {
        return yield* Effect.fail(new StorageConditionNotFound({ id }));
      }
      return yield* service.update(id, input);
    }).pipe(Effect.provide(StorageConditionLive)),
  );
  return json(conditions, {
    revalidate: [getStorageConditions.key],
  });
});

export const deleteStorageCondition = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const [user, session] = auth;
  if (!user || !session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const conditions = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(StorageConditionService);
      const c = yield* service.findById(id);
      if (!c) {
        return yield* Effect.fail(new StorageConditionNotFound({ id }));
      }
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(StorageConditionLive)),
  );
  return json(conditions, {
    revalidate: [getStorageConditions.key],
  });
});
