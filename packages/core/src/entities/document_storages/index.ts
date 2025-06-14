import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { safeParse, type InferInput } from "valibot";
import {
  DocumentStorageCreateSchema,
  DocumentStorageUpdateSchema,
  TB_document_storages,
  TB_organizations_storages,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { generateBasePath } from "../utils";
import { S3DocumentStorageLive, S3DocumentStorageService } from "../vfs/s3";
import {
  StorageInvalidId,
  StorageNotCreated,
  StorageNotDeleted,
  StorageNotFound,
  StorageNotUpdated,
  StorageOrganizationInvalidId,
  StorageOrganizationLinkFailed,
} from "./errors";

export class DocumentStorageService extends Effect.Service<DocumentStorageService>()("@warehouse/document-storages", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_document_storages.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        documents: true,
        offer: true,
        queuedDocuments: true,
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (input: InferInput<typeof DocumentStorageCreateSchema>, organization_id: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organization_id);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new StorageOrganizationInvalidId({ organizationId: organization_id }));
        }

        const [storage] = yield* Effect.promise(() => db.insert(TB_document_storages).values(input).returning());
        if (!storage) {
          return yield* Effect.fail(new StorageNotCreated({}));
        }

        const connectedWithOrg = yield* Effect.promise(() =>
          db
            .insert(TB_organizations_storages)
            .values({
              organizationId: parsedOrgId.output,
              storageId: storage.id,
            })
            .returning(),
        );

        if (!connectedWithOrg) {
          return yield* Effect.fail(
            new StorageOrganizationLinkFailed({ organizationId: organization_id, storageId: storage.id }),
          );
        }

        return storage;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id }));
        }

        const storage = yield* Effect.promise(() =>
          db.query.TB_document_storages.findFirst({
            where: (storages, operations) => operations.eq(storages.id, parsedId.output),
            with: relations,
          }),
        );

        if (!storage) {
          return yield* Effect.fail(new StorageNotFound({ id }));
        }

        return storage;
      });

    const findByOrganizationId = (organizationId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageOrganizationInvalidId({ organizationId }));
        }

        const entries = yield* Effect.promise(() =>
          db.query.TB_organizations_storages.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedId.output),
            with: {
              storage: {
                with: relations,
              },
            },
          }),
        );

        return entries.map((entry) => entry.storage);
      });

    const update = (input: InferInput<typeof DocumentStorageUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: input.id }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_document_storages.findFirst({
            where: (storages, operations) => operations.eq(storages.id, input.id),
          }),
        );

        if (!exists) {
          return yield* Effect.fail(new StorageNotFound({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_document_storages)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_document_storages.id, input.id))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new StorageNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_document_storages)
            .set({ deletedAt: new Date() })
            .where(eq(TB_document_storages.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new StorageNotDeleted({ id }));
        }

        return deleted;
      });

    return {
      create,
      findById,
      findByOrganizationId,
      update,
      remove,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DocumentStorageLive = DocumentStorageService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<DocumentStorageService["findById"]>>>;
