import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import storageOffers from "../../data/storage_offers.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  DocumentStorageOfferCreate,
  DocumentStorageOfferCreateSchema,
  DocumentStorageOfferUpdateSchema,
  TB_document_storage_offers,
  TB_organizations_storages,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { generateBasePath } from "../utils";
import { S3DocumentStorageLive, S3DocumentStorageService } from "../vfs/s3";
import {
  DocumentStorageOfferCreateFailed,
  DocumentStorageOfferDeleteFailed,
  DocumentStorageOfferInvalidId,
  DocumentStorageOfferNotFound,
  DocumentStorageOfferUpdateFailed,
} from "./errors";

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
            return yield* Effect.fail(new DocumentStorageOfferInvalidId({ id: organization_id }));
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
            return yield* Effect.fail(new DocumentStorageOfferCreateFailed({ organizationId: organization_id }));
          }

          return storage;
        });

      const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) {
            return yield* Effect.fail(new DocumentStorageOfferInvalidId({ id }));
          }

          const result = yield* Effect.promise(() =>
            db.query.TB_document_storage_offers.findFirst({
              where: (storages, operations) => operations.eq(storages.id, parsedId.output),
              with: relations,
            }),
          );

          if (!result) {
            return yield* Effect.fail(new DocumentStorageOfferNotFound({ id }));
          }

          return result;
        });

      const update = (input: InferInput<typeof DocumentStorageOfferUpdateSchema>) =>
        Effect.gen(function* (_) {
          const exists = yield* Effect.promise(() =>
            db.query.TB_document_storages.findFirst({
              where: (storages, operations) => operations.eq(storages.id, input.id),
            }),
          );
          if (!exists) {
            return yield* Effect.fail(new DocumentStorageOfferNotFound({ id: input.id }));
          }

          const [updated] = yield* Effect.promise(() =>
            db
              .update(TB_document_storage_offers)
              .set({ ...input, updatedAt: new Date() })
              .where(eq(TB_document_storage_offers.id, input.id))
              .returning(),
          );

          if (!updated) {
            return yield* Effect.fail(new DocumentStorageOfferUpdateFailed({ id: input.id }));
          }

          return updated;
        });

      const remove = (id: string) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) {
            return yield* Effect.fail(new DocumentStorageOfferInvalidId({ id }));
          }

          const result = yield* Effect.promise(() =>
            db
              .update(TB_document_storage_offers)
              .set({ deletedAt: new Date() })
              .where(eq(TB_document_storage_offers.id, parsedId.output))
              .returning(),
          );

          if (result.length === 0) {
            return yield* Effect.fail(new DocumentStorageOfferDeleteFailed({ id }));
          }

          return result;
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

          const sos = parse(
            array(
              object({
                ...DocumentStorageOfferCreateSchema.entries,
                id: prefixed_cuid2,
              }),
            ),
            storageOffers,
          );

          const existing = offers.map((v) => v.id);

          const toCreate = sos.filter((t) => !existing.includes(t.id));

          if (toCreate.length > 0) {
            const created = yield* Effect.promise(() =>
              db.insert(TB_document_storage_offers).values(toCreate).returning(),
            );
            yield* Effect.log("Created storage offers", created);
          }

          const toUpdate = sos.filter((t) => existing.includes(t.id));
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

          return sos;
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
