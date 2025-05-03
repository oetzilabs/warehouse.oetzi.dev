import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { DocumentStorageCreateSchema, DocumentStorageUpdateSchema, TB_document_storages } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";
import { S3StorageLive, S3StorageService } from "./vfs/s3";

export class DocumentStorageService extends Effect.Service<DocumentStorageService>()("@warehouse/document-storages", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    const vfs = yield* _(S3StorageService);

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_document_storages.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        documents: true,
        organization: true,
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
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        const [storage] = yield* Effect.promise(() =>
          db
            .insert(TB_document_storages)
            .values({ ...input, organization_id: parsedOrgId.output, path: vfs.basePath })
            .returning(),
        );

        return storage;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid storage ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_document_storages.findFirst({
            where: (storages, operations) => operations.eq(storages.id, parsedId.output),
            with: relations,
          }),
        );
      });

    const findByOrganizationId = (organizationId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_document_storages.findMany({
            where: (storages, operations) => operations.eq(storages.organization_id, parsedId.output),
            with: relations,
          }),
        );
      });

    const update = (input: InferInput<typeof DocumentStorageUpdateSchema>) =>
      Effect.gen(function* (_) {
        const exists = yield* Effect.promise(() =>
          db.query.TB_document_storages.findFirst({
            where: (storages, operations) => operations.eq(storages.id, input.id),
          }),
        );
        if (!exists) {
          return yield* Effect.fail(new Error("Storage does not exist"));
        }
        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_document_storages)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_document_storages.id, input.id))
            .returning(),
        );
        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid storage ID"));
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_document_storages)
            .set({ deletedAt: new Date() })
            .where(eq(TB_document_storages.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );
      });

    return {
      create,
      findById,
      findByOrganizationId,
      update,
      remove,
    } as const;
  }),
  dependencies: [DatabaseLive, S3StorageLive],
}) {}

export const DocumentStorageLive = DocumentStorageService.Default.pipe(Layer.provide(S3StorageLive));

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<DocumentStorageService["findById"]>>>;
