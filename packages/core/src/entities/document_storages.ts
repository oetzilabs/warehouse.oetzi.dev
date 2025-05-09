import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { DocumentStorageCreateSchema, DocumentStorageUpdateSchema, TB_document_storages } from "../drizzle/sql/schema";
import { TB_organizations_storages } from "../drizzle/sql/schemas/organizations_storages";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";
import { generateBasePath } from "./utils";
import { S3DocumentStorageLive, S3DocumentStorageService } from "./vfs/s3";

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
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        const [storage] = yield* Effect.promise(() => db.insert(TB_document_storages).values(input).returning());

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
          return yield* Effect.fail(new Error("Failed to connect storage to organization"));
        }

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
  dependencies: [DatabaseLive],
}) {}

export const DocumentStorageLive = DocumentStorageService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<DocumentStorageService["findById"]>>>;
