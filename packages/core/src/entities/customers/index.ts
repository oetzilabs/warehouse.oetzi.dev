import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
  TB_customer_notes,
  TB_customer_preferred_deliverytimes,
  TB_customer_preferred_pickuptimes,
  TB_customers,
  TB_organization_customers,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import {
  CustomerInvalidId,
  CustomerNotCreated,
  CustomerNotDeleted,
  CustomerNoteInvalidId,
  CustomerNoteNotFound,
  CustomerNotFound,
  CustomerNotUpdated,
} from "./errors";

export class CustomerService extends Effect.Service<CustomerService>()("@warehouse/customers", {
  effect: Effect.gen(function* (_) {
    const database = yield* DatabaseService;
    const db = yield* database.instance;

    const create = Effect.fn("@warehouse/customers/create")(function* (input: InferInput<typeof CustomerCreateSchema>) {
      const orgId = yield* OrganizationId;
      const [customer] = yield* Effect.promise(() => db.insert(TB_customers).values(input).returning());
      if (!customer) {
        return yield* Effect.fail(new CustomerNotCreated({}));
      }

      yield* Effect.promise(() =>
        db.insert(TB_organization_customers).values({ customer_id: customer.id, organization_id: orgId }).returning(),
      );

      return yield* findById(customer.id);
    });

    const findById = Effect.fn("@warehouse/customers/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }
      const orgId = yield* OrganizationId;

      const customer = yield* Effect.promise(() =>
        db.query.TB_customers.findFirst({
          where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          with: {
            pdt: true,
            ppt: true,
            sales: {
              with: {
                items: {
                  with: {
                    product: true,
                  },
                },
              },
            },
            organizations: {
              with: {
                organization: true,
              },
            },
            orders: {
              with: {
                custSched: {
                  with: {
                    schedule: true,
                  },
                },
                products: {
                  with: {
                    product: true,
                  },
                },
              },
            },
            notes: {
              orderBy: (fields, operations) => [operations.desc(fields.updatedAt), operations.desc(fields.createdAt)],
            },
          },
        }),
      );

      if (!customer) {
        return yield* Effect.fail(new CustomerNotFound({ id }));
      }

      return {
        ...customer,
        organizations: customer.organizations.filter((o) => o.organization_id === orgId).map((co) => co.organization),
      };
    });

    const getSalesHistory = Effect.fn("@warehouse/customers/getSalesHistory")(function* (id: string) {
      const customer = yield* Effect.promise(() =>
        db.query.TB_customers.findFirst({
          where: (fields, operations) => operations.eq(fields.id, id),
          with: {
            sales: {
              with: {
                items: {
                  with: {
                    product: true,
                  },
                },
              },
            },
          },
        }),
      );
      if (!customer) {
        return yield* Effect.fail(new CustomerNotFound({ id }));
      }
      return customer.sales;
    });

    const update = Effect.fn("@warehouse/customers/update")(function* (input: InferInput<typeof CustomerUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: input.id }));
      }

      const [updated] = yield* Effect.promise(() =>
        db
          .update(TB_customers)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(TB_customers.id, parsedId.output))
          .returning(),
      );

      if (!updated) {
        return yield* Effect.fail(new CustomerNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const findByOrganizationId = Effect.fn("@warehouse/customers/findByOrganizationId")(function* () {
      const orgId = yield* OrganizationId;
      const orgCustomers = yield* Effect.promise(() =>
        db.query.TB_organization_customers.findMany({
          where: (fields, operations) => operations.eq(fields.organization_id, orgId),
          with: {
            customer: {
              with: {
                pdt: true,
                ppt: true,
                schedules: {
                  with: {
                    schedule: true,
                  },
                },
                sales: {
                  with: {
                    items: {
                      with: {
                        product: true,
                      },
                    },
                  },
                },
                organizations: {
                  with: {
                    organization: true,
                  },
                },
                orders: {
                  with: {
                    custSched: {
                      with: {
                        schedule: true,
                      },
                    },
                    products: {
                      with: {
                        product: true,
                      },
                    },
                  },
                },
                notes: {
                  orderBy: (fields, operations) => [
                    operations.desc(fields.updatedAt),
                    operations.desc(fields.createdAt),
                  ],
                },
              },
            },
          },
        }),
      );
      return orgCustomers.map((orgCustomer) => orgCustomer.customer);
    });

    const getOrdersByCustomerId = Effect.fn("@warehouse/customers/getOrdersByCustomerId")(function* (
      customerId: string,
    ) {
      const orgId = yield* OrganizationId;
      const parsedCustomerId = safeParse(prefixed_cuid2, customerId);
      if (!parsedCustomerId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }
      const orders = yield* Effect.promise(() =>
        db.query.TB_customer_orders.findMany({
          where: (fields, operations) =>
            operations.and(
              operations.eq(fields.customer_id, parsedCustomerId.output),
              operations.eq(fields.organization_id, orgId),
            ),
          with: {
            sale: {
              with: {
                discounts: {
                  with: {
                    discount: true,
                  },
                },
              },
            },
            custSched: {
              with: {
                schedule: true,
              },
            },
            users: {
              with: {
                user: {
                  columns: {
                    hashed_password: false,
                  },
                },
              },
            },
            products: {
              with: {
                product: {
                  with: {
                    organizations: {
                      with: {
                        priceHistory: true,
                        tg: {
                          with: {
                            crs: {
                              with: {
                                tr: true,
                              },
                            },
                          },
                        },
                      },
                    },
                    brands: true,
                  },
                },
              },
            },
          },
        }),
      );

      return orders.map((order) => ({
        ...order,
        products: order.products.map((p) => ({
          ...p,
          product: {
            ...p.product,
            organizations: p.product.organizations.filter((org) => org.organizationId === orgId),
            priceHistory:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
            currency: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
            sellingPrice: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
          },
        })),
      }));
    });

    const remove = Effect.fn("@warehouse/customers/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }
      const [deleted] = yield* Effect.promise(() =>
        db.delete(TB_customers).where(eq(TB_customers.id, parsedId.output)).returning(),
      );
      if (!deleted) {
        return yield* Effect.fail(new CustomerNotDeleted({ id }));
      }
      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/customers/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }
      const [deleted] = yield* Effect.promise(() =>
        db.update(TB_customers).set({ deletedAt: new Date() }).where(eq(TB_customers.id, parsedId.output)).returning(),
      );
      if (!deleted) {
        return yield* Effect.fail(new CustomerNotDeleted({ id }));
      }
      return deleted;
    });

    const addPreferredDeliveryDateTime = Effect.fn("@warehouse/customers/addPreferredDeliveryDateTime")(function* (
      input: { startTime: Date; endTime?: Date; notes?: string },
      customerId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, customerId);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }

      return yield* Effect.promise(() =>
        db
          .insert(TB_customer_preferred_deliverytimes)
          .values({ ...input, customerId: parsedId.output })
          .returning(),
      );
    });

    const removePreferredDeliveryDateTime = Effect.fn("@warehouse/customers/removePreferredDeliveryDateTime")(
      function* (id: string) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id }));
        }

        return yield* Effect.promise(() =>
          db
            .delete(TB_customer_preferred_deliverytimes)
            .where(eq(TB_customer_preferred_deliverytimes.id, parsedId.output))
            .returning(),
        );
      },
    );

    const addPreferredPickupDateTime = Effect.fn("@warehouse/customers/addPreferredPickupDateTime")(function* (
      input: { startTime: Date; endTime?: Date; notes?: string },
      customerId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, customerId);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }

      return yield* Effect.promise(() =>
        db
          .insert(TB_customer_preferred_pickuptimes)
          .values({ ...input, customerId: parsedId.output })
          .returning(),
      );
    });

    const removePreferredPickupDateTime = Effect.fn("@warehouse/customers/removePreferredPickupDateTime")(function* (
      id: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }

      return yield* Effect.promise(() =>
        db
          .delete(TB_customer_preferred_pickuptimes)
          .where(eq(TB_customer_preferred_pickuptimes.id, parsedId.output))
          .returning(),
      );
    });

    const findNoteById = Effect.fn("@warehouse/customers/findNoteById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }

      const note = yield* Effect.promise(() =>
        db.query.TB_customer_notes.findFirst({
          where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          with: {
            customer: true,
          },
        }),
      );
      if (!note) {
        return yield* Effect.fail(new CustomerNoteNotFound({ id }));
      }
      return note;
    });

    const addNote = Effect.fn("@warehouse/customers/addNote")(function* (
      title: string,
      content: string,
      customerId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, customerId);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }

      return yield* Effect.promise(() =>
        db.insert(TB_customer_notes).values({ title, content, customerId: parsedId.output }).returning(),
      );
    });

    const removeNote = Effect.fn("@warehouse/customers/removeNote")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerNoteInvalidId({ id }));
      }

      return yield* Effect.promise(() =>
        db.delete(TB_customer_notes).where(eq(TB_customer_notes.id, parsedId.output)).returning(),
      );
    });

    const updateNote = Effect.fn("@warehouse/customers/updateNote")(function* (
      id: string,
      title: string,
      content: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id }));
      }

      const [updated] = yield* Effect.promise(() =>
        db
          .update(TB_customer_notes)
          .set({ title, content, updatedAt: new Date() })
          .where(eq(TB_customer_notes.id, parsedId.output))
          .returning(),
      );

      if (!updated) {
        return yield* Effect.fail(new CustomerNotUpdated({ id }));
      }

      return updated;
    });

    return {
      create,
      findById,
      update,
      getSalesHistory,
      findByOrganizationId,
      remove,
      safeRemove,
      getOrdersByCustomerId,
      addPreferredDeliveryDateTime,
      removePreferredDeliveryDateTime,
      addPreferredPickupDateTime,
      removePreferredPickupDateTime,
      findNoteById,
      addNote,
      updateNote,
      removeNote,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CustomerLive = CustomerService.Default;
export type CustomerInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<CustomerService["findById"]>>>>;
