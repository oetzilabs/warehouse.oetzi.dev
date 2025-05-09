import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  DocumentStorageOfferCreate,
  DocumentStorageOfferCreateSchema,
  DocumentStorageOfferUpdateSchema,
  TB_document_storage_offers,
  TB_organizations_storages,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";
import { generateBasePath } from "./utils";
import { S3DocumentStorageLive, S3DocumentStorageService } from "./vfs/s3";

export class DocumentStorageOfferService extends Effect.Service<DocumentStorageOfferService>()(
  "@warehouse/document-storage-offers",
  {
    effect: Effect.gen(function* (_) {
      const database = yield* _(DatabaseService);
      const db = yield* database.instance;

      type FindManyParams = NonNullable<Parameters<typeof db.query.TB_document_storage_offers.findMany>[0]>;

      const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
        const defaultRelations: NonNullable<FindManyParams["with"]> = {
          featureSets: {
            with: {
              feature_set: true,
            },
          },
        };

        if (options) {
          return options;
        }
        return defaultRelations;
      };

      const create = (input: InferInput<typeof DocumentStorageOfferCreateSchema>, organization_id: string) =>
        Effect.gen(function* (_) {
          const parsedOrgId = safeParse(prefixed_cuid2, organization_id);
          if (!parsedOrgId.success) {
            return yield* Effect.fail(new Error("Invalid organization ID format"));
          }

          const [storage] = yield* Effect.promise(() =>
            db.insert(TB_document_storage_offers).values(input).returning(),
          );

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
            db.query.TB_document_storage_offers.findFirst({
              where: (storages, operations) => operations.eq(storages.id, parsedId.output),
              with: relations,
            }),
          );
        });

      const update = (input: InferInput<typeof DocumentStorageOfferUpdateSchema>) =>
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
              .update(TB_document_storage_offers)
              .set({ ...input, updatedAt: new Date() })
              .where(eq(TB_document_storage_offers.id, input.id))
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
              .update(TB_document_storage_offers)
              .set({ deletedAt: new Date() })
              .where(eq(TB_document_storage_offers.id, parsedId.output))
              .returning()
              .then(([x]) => x),
          );
        });

      const all = (relations: FindManyParams["with"] = withRelations()) =>
        Effect.gen(function* (_) {
          return yield* Effect.promise(() =>
            db.query.TB_document_storage_offers.findMany({
              with: relations,
            }),
          );
        });

      const seed = () =>
        Effect.gen(function* (_) {
          const offers = yield* Effect.promise(() => db.query.TB_document_storage_offers.findMany());

          const storageOffers = [
            {
              id: "dso_kfpl4k5nrei8b7tmnhw66o99",
              name: "basic",
              description: "Basic storage offering",
              price: 0.0,
              maxSize: 1024 * 1024 * 1024,
              maxQueueSize: 10,
              shareable: false,
            },
            {
              id: "dso_h47ql2wuzp7lp7c7m1xok37f",
              name: "pro",
              description: "Pro storage offering",
              price: 10.0,
              maxSize: 1024 * 1024 * 1024 * 10,
              maxQueueSize: 100,
              shareable: false,
            },
          ];

          const existing = offers.map((v) => v.id);

          const toCreate = storageOffers.filter((t) => !existing.includes(t.id));

          if (toCreate.length > 0) {
            const created = yield* Effect.promise(() =>
              db.insert(TB_document_storage_offers).values(toCreate).returning(),
            );
            yield* Effect.log("Created storage offers", created);
          }

          const toUpdate = storageOffers.filter((t) => existing.includes(t.id));
          if (toUpdate.length > 0) {
            for (const storageOffer of toUpdate) {
              const updated = yield* Effect.promise(() =>
                db
                  .update(TB_document_storage_offers)
                  .set({ ...storageOffer, updatedAt: new Date() })
                  .where(eq(TB_document_storage_offers.id, storageOffer.id))
                  .returning(),
              );
              yield* Effect.log("Updated storage offer", updated);
            }
          }

          return storageOffers;
        });

      return {
        create,
        findById,
        update,
        remove,
        all,
        seed,
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}

export const DocumentStorageOfferLive = DocumentStorageOfferService.Default;

// Type exports
export type DocumentStorageOffer = NonNullable<Awaited<ReturnType<DocumentStorageOfferService["findById"]>>>;
