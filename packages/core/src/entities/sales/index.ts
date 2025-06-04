import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, number, object, parse, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { SaleCreateSchema, SaleUpdateSchema, TB_sales } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrderNotFound } from "../orders/errors";
import { OrganizationInfo, OrganizationLive, OrganizationService } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import {
  SaleInvalidId,
  SaleNotCreated,
  SaleNotDeleted,
  SaleNotFound,
  SaleNotUpdated,
  SaleOrganizationNotFound,
} from "./errors";

dayjs.extend(isBetween);

export class SalesService extends Effect.Service<SalesService>()("@warehouse/sales", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const organizationsService = yield* _(OrganizationService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_sales.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        items: {
          with: {
            product: true,
          },
        },
        customer: true,
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (saleInput: InferInput<typeof SaleCreateSchema>) =>
      Effect.gen(function* (_) {
        const [sale] = yield* Effect.promise(() => db.insert(TB_sales).values(saleInput).returning());
        if (!sale) {
          return yield* Effect.fail(new SaleNotCreated({}));
        }
        return findById(sale.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id }));
        }

        const sale = yield* Effect.promise(() =>
          db.query.TB_sales.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              items: {
                with: {
                  product: {
                    with: {
                      tg: {
                        with: {
                          crs: {
                            with: {
                              tr: true,
                            },
                          },
                        },
                      },
                      brands: true,
                    },
                  },
                },
              },
              customer: true,
            },
          }),
        );

        if (!sale) {
          return yield* Effect.fail(new SaleNotFound({ id }));
        }

        return sale;
      });

    const update = (id: string, saleInput: InferInput<typeof SaleUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id }));
        }
        const [updatedSale] = yield* Effect.promise(() =>
          db
            .update(TB_sales)
            .set({ ...saleInput, updatedAt: new Date() })
            .where(eq(TB_sales.id, parsedId.output))
            .returning(),
        );
        if (!updatedSale) {
          return yield* Effect.fail(new SaleNotUpdated({ id }));
        }
        return updatedSale;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id }));
        }
        const [deletedSale] = yield* Effect.promise(() =>
          db.delete(TB_sales).where(eq(TB_sales.id, parsedId.output)).returning(),
        );
        if (!deletedSale) {
          return yield* Effect.fail(new SaleNotDeleted({ id }));
        }
        return deletedSale;
      });

    const calculateTotal = (id: string) =>
      Effect.gen(function* (_) {
        const sale = yield* findById(id);
        if (!sale) {
          return yield* Effect.fail(new SaleNotFound({ id }));
        }
        return sale.items.reduce((total, item) => total + item.quantity * item.price, 0);
      });

    const findWithinRange = (orgId: string, start: Date, end: Date) =>
      Effect.gen(function* (_) {
        const org = yield* organizationsService.findById(orgId);
        if (!org) {
          return yield* Effect.fail(new SaleOrganizationNotFound({ orgId }));
        }
        const sales = yield* Effect.promise(() =>
          db.query.TB_organizations_sales.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, org.id),
            with: {
              sale: {
                with: {
                  items: {
                    with: {
                      product: true,
                    },
                  },
                  customer: true,
                },
              },
            },
          }),
        );
        return sales.filter((s) => dayjs(s.sale.createdAt).isBetween(start, end));
      });

    const findByOrganizationId = (orgId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, orgId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
        }
        const sales = yield* Effect.promise(() =>
          db.query.TB_organizations_sales.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedOrgId.output),
            with: {
              sale: {
                with: {
                  items: {
                    with: {
                      product: {
                        with: {
                          tg: {
                            with: {
                              crs: {
                                with: {
                                  tr: true,
                                },
                              },
                            },
                          },
                          brands: true,
                        },
                      },
                    },
                  },
                  customer: true,
                },
              },
            },
          }),
        );
        return sales.map((s) => s.sale);
      });

    // const findByWarehouseId = (warehouseId: string) =>
    //   Effect.gen(function* (_) {
    //     const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
    //     if (!parsedWarehouseId.success) {
    //       return yield* Effect.fail(new OrganizationInvalidId({ id: warehouseId }));
    //     }
    //     const sales = yield* Effect.promise(() =>
    //       db.query.TB_sales.findMany({
    //         where: (fields, operations) => operations.eq(fields.warehouseId, parsedWarehouseId.output),
    //         with: {
    //           items: {
    //             with: {
    //               product: true,
    //             },
    //           },
    //           customer: true,
    //         },
    //       }),
    //     );
    //     return sales;
    //   });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_sales)
            .set({ status: "deleted", deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(TB_sales.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new SaleNotDeleted({ id }));
        }

        return deleted;
      });
    const generatePDF = (
      id: string,
      organization: OrganizationInfo,
      options: {
        page: {
          size: PaperSize;
          orientation: PaperOrientation;
        };
      },
    ) =>
      Effect.gen(function* (_) {
        const sale = yield* findById(id);
        if (!sale) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        const pdfGenService = yield* _(PDFService);
        let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.sale(sale, organization, {
          page: options.page,
        });

        return generatedPdf;
      }).pipe(Effect.provide(PDFLive));

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      calculateTotal,
      findWithinRange,
      findByOrganizationId,
      generatePDF,
    } as const;
  }),
  dependencies: [DatabaseLive, OrganizationLive],
}) {}

export const SalesLive = SalesService.Default;
export type SaleInfo = NonNullable<Effect.Effect.Success<ReturnType<SalesService["findById"]>>>;
