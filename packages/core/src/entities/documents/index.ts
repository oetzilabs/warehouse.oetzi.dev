import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DocumentCreateSchema, DocumentUpdateSchema, TB_documents } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  DocumentInvalidId,
  DocumentNotCreated,
  DocumentNotDeleted,
  DocumentNotFound,
  DocumentNotUpdated,
  DocumentUserInvalidId,
  DocumentUserLinkFailed,
} from "./errors";

export class DocumentService extends Effect.Service<DocumentService>()("@warehouse/documents", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    const create = (userInput: InferInput<typeof DocumentCreateSchema>) =>
      Effect.gen(function* (_) {
        const [document] = yield* db
          .insert(TB_documents)
          .values({ ...userInput })
          .returning();

        if (!document) {
          return yield* Effect.fail(new DocumentNotCreated({}));
        }

        return document;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DocumentInvalidId({ id }));
        }

        const document = yield* db.query.TB_documents.findFirst({
          where: (documents, operations) => operations.eq(documents.id, parsedId.output),
          with: {
            storage: true,
          },
        });

        if (!document) {
          return yield* Effect.fail(new DocumentNotFound({ id }));
        }

        return document;
      });

    const update = (input: InferInput<typeof DocumentUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DocumentInvalidId({ id: input.id }));
        }

        const [updated] = yield* db
          .update(TB_documents)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(TB_documents.id, parsedId.output))
          .returning();

        if (!updated) {
          return yield* Effect.fail(new DocumentNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DocumentInvalidId({ id }));
        }

        const [deleted] = yield* db.delete(TB_documents).where(eq(TB_documents.id, parsedId.output)).returning();

        if (!deleted) {
          return yield* Effect.fail(new DocumentNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new DocumentInvalidId({ id }));
        }

        const entries = yield* db
          .update(TB_documents)
          .set({ deletedAt: new Date() })
          .where(eq(TB_documents.id, parsedId.output))
          .returning();

        if (entries.length === 0) {
          return yield* Effect.fail(new DocumentNotCreated({ message: "Failed to safe remove document" }));
        }

        return entries[0];
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new DocumentInvalidId({ id: organizationId }));
        }
        const documents = yield* db.query.TB_organizations_documents.findMany({
          where: (documents, operations) => operations.eq(documents.organizationId, parsedOrganizationId.output),
          with: {
            document: {
              with: {
                storage: true,
              },
            },
          },
        });
        return documents.map((d) => d.document);
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const DocumentLive = DocumentService.Default;

// Type exports
export type DocumentInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<DocumentService["findById"]>>>>;
