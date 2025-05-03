import { S3Client } from "@aws-sdk/client-s3";
import { action, json, query, redirect } from "@solidjs/router";
import {
  DocumentStorageCreateSchema,
  DocumentStorageUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { DocumentStorageLive, DocumentStorageService } from "@warehouseoetzidev/core/src/entities/document_storages";
import { makeS3Service, S3StorageLive } from "@warehouseoetzidev/core/src/entities/vfs/s3";
import { Effect, Layer } from "effect";
import { Resource } from "sst";
import { InferInput } from "valibot";
import { withSession } from "./session";

export const getDocumentStorageById = query(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const Documentstorage = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageService);
      return yield* service.findById(id);
    }).pipe(
      Effect.provide(DocumentStorageLive),
      Effect.provide(makeS3Service({ bucket: Resource.MainBucket.name, client: new S3Client() }, "/warehouses")),
    ),
  );
  return Documentstorage;
}, "Documentstorage-by-id");

export const createDocumentStorage = action(async (data: InferInput<typeof DocumentStorageCreateSchema>) => {
  "use server";
  const auth = await withSession();

  if (!auth) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const session = auth[1];
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw new Error("You have to be part of an organization to perform this action.");
  }

  const Documentstorage = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageService);
      return yield* service.create(data, orgId);
    }).pipe(
      Effect.provide(DocumentStorageLive),
      Effect.provide(makeS3Service({ bucket: Resource.MainBucket.name, client: new S3Client() }, "/warehouses")),
    ),
  );
  return Documentstorage;
});

export const updateDocumentStorage = action(async (data: InferInput<typeof DocumentStorageUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const Documentstorage = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageService);
      return yield* service.update(data);
    }).pipe(
      Effect.provide(DocumentStorageLive),
      Effect.provide(makeS3Service({ bucket: Resource.MainBucket.name, client: new S3Client() }, "/warehouses")),
    ),
  );
  return Documentstorage;
});

export const deleteDocumentStorage = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw new Error("You have to be logged in to perform this action.");
  }
  const Documentstorage = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageService);
      return yield* service.remove(id);
    }).pipe(
      Effect.provide(DocumentStorageLive),
      Effect.provide(makeS3Service({ bucket: Resource.MainBucket.name, client: new S3Client() }, "/warehouses")),
    ),
  );
  return Documentstorage;
});

export const getDocumentStoragesByOrganization = query(async (organizationId: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const Documentstorages = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(DocumentStorageService);
      return yield* service.findByOrganizationId(organizationId);
    }).pipe(
      Effect.provide(DocumentStorageLive),
      Effect.provide(makeS3Service({ bucket: Resource.MainBucket.name, client: new S3Client() }, "/warehouses")),
    ),
  );
  return Documentstorages;
}, "Documentstorages-by-organization");
