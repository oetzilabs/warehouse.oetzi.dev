import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { CertificateCreateSchema, CertificateUpdateSchema, TB_certificates } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  CertificateInvalidId,
  CertificateNotCreated,
  CertificateNotDeleted,
  CertificateNotFound,
  CertificateNotUpdated,
} from "./errors";

export class CertificateService extends Effect.Service<CertificateService>()("@warehouse/certificates", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (userInput: InferInput<typeof CertificateCreateSchema>) =>
      Effect.gen(function* (_) {
        const [certificate] = yield* Effect.promise(() => db.insert(TB_certificates).values(userInput).returning());

        if (!certificate) {
          return yield* Effect.fail(new CertificateNotCreated({}));
        }

        return certificate;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CertificateInvalidId({ id }));
        }

        const certificate = yield* Effect.promise(() =>
          db.query.TB_certificates.findFirst({
            where: (certificates, operations) => operations.eq(certificates.id, parsedId.output),
          }),
        );

        if (!certificate) {
          return yield* Effect.fail(new CertificateNotFound({ id }));
        }

        return certificate;
      });

    const update = (input: InferInput<typeof CertificateUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CertificateInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_certificates)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_certificates.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new CertificateNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CertificateInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_certificates).where(eq(TB_certificates.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new CertificateNotDeleted({ id }));
        }

        return deleted;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_certificates.findMany());
      });

    return {
      create,
      findById,
      update,
      remove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CertificateLive = CertificateService.Default;

export type CertificateInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<CertificateService["findById"]>>>>;
