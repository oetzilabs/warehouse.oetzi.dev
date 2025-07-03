import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { safeParse, type InferInput } from "valibot";
import {
  CustomerOrderCreateSchema,
  OrganizationCreateSchema,
  OrganizationProductCreateSchema,
  OrganizationProductUpdateSchema,
  OrganizationUpdateSchema,
  SupplierPurchaseCreateSchema,
  TB_customer_orders,
  TB_organization_users,
  TB_organizations,
  TB_organizations_products,
  TB_supplier_purchases,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { CustomerInvalidId } from "../customers/errors";
import { OrderInvalidId } from "../orders/errors";
import { ProductInvalidId } from "../products/errors";
import { SupplierInvalidId, SupplierPurchaseInvalidId, SupplierPurchaseNotCreated } from "../suppliers/errors";
import {
  OrganizationAlreadyExists,
  OrganizationInvalidId,
  OrganizationNotDeleted,
  OrganizationNotFound,
  OrganizationNotUpdated,
  OrganizationProductInvalidId,
  OrganizationProductNotFound,
  OrganizationProductNotUpdated,
  OrganizationUserAddFailed,
  OrganizationUserAlreadyExists,
  OrganizationUserInvalidId,
  OrganizationUserNotFound,
  OrganizationUserRemoveFailed,
} from "./errors";
import { OrganizationId } from "./id";

export class OrganizationService extends Effect.Service<OrganizationService>()("@warehouse/organizations", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;
    const generateRandomLetters = (length: number): string => {
      let result = "";
      const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };

    const generateSlug = (name: string) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/-+/g, "-");

      return `${slug}-${generateRandomLetters(6)}`;
    };

    const create = Effect.fn("@warehouse/organizations/create")(function* (
      userInput: InferInput<typeof OrganizationCreateSchema>,
      userId: string,
    ) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
      }

      const slug = generateSlug(userInput.name);
      const exists = yield* db.query.TB_organizations.findFirst({
        where: (organizations, operations) => operations.eq(organizations.slug, slug),
      });

      if (exists) {
        return yield* Effect.fail(new OrganizationAlreadyExists({ name: userInput.name, slug }));
      }

      const [org] = yield* db
        .insert(TB_organizations)
        .values({ ...userInput, owner_id: parsedUserId.output, slug: generateSlug(userInput.name) })
        .returning();
      // TODO: Add organization to user's organizations
      const organizationId = Layer.succeed(OrganizationId, org.id);
      const added = yield* addUser(userId).pipe(Effect.provide(organizationId));
      if (!added) {
        return yield* Effect.fail(
          new OrganizationUserAddFailed({ userId: parsedUserId.output, organizationId: org.id }),
        );
      }
      return org;
    });

    const findById = Effect.fn("@warehouse/organizations/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id }));
      }

      const org = yield* db.query.TB_organizations.findFirst({
        where: (organizations, operations) => operations.eq(organizations.id, parsedId.output),
        with: {
          products: {
            with: {
              product: true,
            },
          },
          customerOrders: {
            with: {
              customer: true,
              products: {
                with: {
                  product: true,
                },
              },
              sale: true,
            },
          },
          purchases: {
            with: {
              supplier: true,
              products: {
                with: {
                  product: true,
                },
              },
            },
          },
          devices: {
            with: {
              type: true,
            },
          },
          sales: {
            with: {
              sale: true,
            },
          },
          supps: {
            with: {
              supplier: true,
            },
          },
          customers: {
            with: {
              customer: true,
            },
          },
          catalogs: {
            with: {
              products: {
                with: {
                  product: true,
                },
              },
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
          owner: {
            columns: {
              hashed_password: false,
            },
          },
          whs: {
            with: {
              warehouse: {
                with: {
                  addresses: {
                    with: {
                      address: true,
                    },
                  },
                  facilities: {
                    with: {
                      areas: {
                        with: {
                          storages: {
                            with: {
                              type: true,
                              area: true,
                              products: true,
                              children: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!org) {
        return yield* Effect.fail(new OrganizationNotFound({ id }));
      }
      return org;
    });

    const findBySlug = Effect.fn("@warehouse/organizations/findBySlug")(function* (slug: string) {
      return yield* db.query.TB_organizations.findFirst({
        where: (organizations, operations) => operations.eq(organizations.slug, slug),
        with: {
          customerOrders: {
            with: {
              customer: true,
              products: {
                with: {
                  product: true,
                },
              },
              sale: true,
            },
          },
          purchases: {
            with: {
              supplier: true,
              products: {
                with: {
                  product: true,
                },
              },
            },
          },
          devices: {
            with: {
              type: true,
            },
          },
          sales: {
            with: {
              sale: true,
            },
          },
          products: {
            with: {
              product: true,
            },
          },
          supps: {
            with: {
              supplier: true,
            },
          },
          customers: {
            with: {
              customer: true,
            },
          },
          catalogs: {
            with: {
              products: {
                with: {
                  product: true,
                },
              },
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
          whs: {
            with: {
              warehouse: {
                with: {
                  addresses: {
                    with: {
                      address: true,
                    },
                  },
                  facilities: {
                    with: {
                      areas: {
                        with: {
                          storages: {
                            with: {
                              type: true,
                              area: true,
                              products: true,
                              children: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    const update = Effect.fn("@warehouse/organizations/update")(function* (
      input: InferInput<typeof OrganizationUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_organizations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_organizations.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new OrganizationNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/organizations/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_organizations)
        .set({ deletedAt: new Date() })
        .where(eq(TB_organizations.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new OrganizationNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/organizations/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_organizations)
        .set({ deletedAt: new Date() })
        .where(eq(TB_organizations.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new OrganizationNotDeleted({ id }));
      }

      return deleted;
    });

    const addUser = Effect.fn("@warehouse/organizations/addUser")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
      }

      const orgId = yield* OrganizationId;

      const user = yield* db.query.TB_users.findFirst({
        where: (users, operations) => operations.eq(users.id, parsedUserId.output),
      });

      if (!user) {
        return yield* Effect.fail(new OrganizationUserNotFound({ userId }));
      }

      const exists = yield* db.query.TB_organization_users.findFirst({
        where: (organization_users, operations) =>
          and(
            operations.eq(organization_users.user_id, parsedUserId.output),
            operations.eq(organization_users.organization_id, orgId),
          ),
      });

      if (exists) {
        return yield* Effect.fail(new OrganizationUserAlreadyExists({ userId, organizationId: orgId }));
      }

      const [entry] = yield* db
        .insert(TB_organization_users)
        .values({ user_id: parsedUserId.output, organization_id: orgId })
        .returning();

      if (!entry) {
        return yield* Effect.fail(new OrganizationUserAddFailed({ userId, organizationId: orgId }));
      }

      return entry;
    });

    const removeUser = Effect.fn("@warehouse/organizations/removeUser")(function* (userId: string) {
      const user = yield* db.query.TB_users.findFirst({
        where: (users, operations) => operations.eq(users.id, userId),
      });
      const orgId = yield* OrganizationId;

      if (!user) {
        return yield* Effect.fail(new OrganizationUserNotFound({ userId }));
      }

      const [removed] = yield* db
        .delete(TB_organization_users)
        .where(and(eq(TB_organization_users.user_id, userId), eq(TB_organization_users.organization_id, orgId)))
        .returning();

      if (!removed) {
        return yield* Effect.fail(new OrganizationUserRemoveFailed({ userId, organizationId: orgId }));
      }

      return removed;
    });

    const users = Effect.fn("@warehouse/organizations/users")(function* () {
      const orgId = yield* OrganizationId;

      const organizationExists = yield* db.query.TB_organizations.findFirst({
        where: (organizations, operations) => operations.eq(organizations.id, orgId),
      });

      if (!organizationExists) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }

      return yield* db.query.TB_organization_users.findMany({
        where: (organization_users, operations) => operations.eq(organization_users.organization_id, orgId),
        with: {
          user: true,
        },
      });
    });

    const findByUserId = Effect.fn("@warehouse/organizations/findByUserId")(function* (userId: string) {
      const parsedId = safeParse(prefixed_cuid2, userId);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
      }

      return yield* db.query.TB_organizations.findMany({
        where: (organizations, operations) => operations.eq(organizations.owner_id, parsedId.output),
        with: {
          products: {
            with: {
              product: true,
            },
          },
          customerOrders: {
            with: {
              customer: true,
              products: {
                with: {
                  product: true,
                },
              },
              sale: true,
            },
          },
          purchases: {
            with: {
              supplier: true,
              products: {
                with: {
                  product: true,
                },
              },
            },
          },
          devices: {
            with: {
              type: true,
            },
          },
          sales: {
            with: {
              sale: true,
            },
          },
          supps: {
            with: {
              supplier: true,
            },
          },
          customers: {
            with: {
              customer: true,
            },
          },
          catalogs: {
            with: {
              products: {
                with: {
                  product: true,
                },
              },
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
          owner: {
            columns: {
              hashed_password: false,
            },
          },
          whs: {
            with: {
              warehouse: {
                with: {
                  addresses: {
                    with: {
                      address: true,
                    },
                  },
                  facilities: {
                    with: {
                      areas: {
                        with: {
                          storages: {
                            with: {
                              type: true,
                              area: true,
                              products: true,
                              children: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    const addCustomerOrder = Effect.fn("@warehouse/organizations/addCustomerOrder")(function* (
      data: InferInput<typeof CustomerOrderCreateSchema>,
      orderId: string,
      customerId: string,
    ) {
      const parsedOrderId = safeParse(prefixed_cuid2, orderId);
      const parsedCustomerId = safeParse(prefixed_cuid2, customerId);

      if (!parsedOrderId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
      }
      if (!parsedCustomerId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }

      const orgId = yield* OrganizationId;

      return yield* db
        .insert(TB_customer_orders)
        .values({
          ...data,
          organization_id: orgId,
          customer_id: parsedCustomerId.output,
          id: parsedOrderId.output,
        })
        .returning();
    });

    const removeCustomerOrder = Effect.fn("@warehouse/organizations/removeCustomerOrder")(function* (
      orderId: string,
      customerId: string,
    ) {
      const parsedOrderId = safeParse(prefixed_cuid2, orderId);
      const parsedCustomerId = safeParse(prefixed_cuid2, customerId);

      if (!parsedOrderId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
      }
      if (!parsedCustomerId.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
      }

      const orgId = yield* OrganizationId;

      return yield* db
        .delete(TB_customer_orders)
        .where(
          and(
            eq(TB_customer_orders.organization_id, orgId),
            eq(TB_customer_orders.id, parsedOrderId.output),
            eq(TB_customer_orders.customer_id, parsedCustomerId.output),
          ),
        )
        .returning();
    });

    const addSupplierPurchase = Effect.fn("@warehouse/organizations/addSupplierPurchase")(function* (
      data: InferInput<typeof SupplierPurchaseCreateSchema>,
      supplierId: string,
    ) {
      const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);

      if (!parsedSupplierId.success) {
        return yield* Effect.fail(new SupplierInvalidId({ id: supplierId }));
      }
      const orgId = yield* OrganizationId;

      const [purchase] = yield* db
        .insert(TB_supplier_purchases)
        .values({
          ...data,
          organization_id: orgId,
        })
        .returning();

      if (!purchase) {
        return yield* Effect.fail(new SupplierPurchaseNotCreated({}));
      }
      return purchase;
    });

    const removeSupplierPurchase = Effect.fn("@warehouse/organizations/removeSupplierPurchase")(function* (
      supplierPurchaseId: string,
    ) {
      const parsedSupplierPurchaseId = safeParse(prefixed_cuid2, supplierPurchaseId);

      if (!parsedSupplierPurchaseId.success) {
        return yield* Effect.fail(new SupplierPurchaseInvalidId({ id: supplierPurchaseId }));
      }

      const orgId = yield* OrganizationId;

      return yield* db
        .update(TB_supplier_purchases)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(TB_supplier_purchases.organization_id, orgId),
            eq(TB_supplier_purchases.id, parsedSupplierPurchaseId.output),
          ),
        )
        .returning();
    });

    const removeProduct = Effect.fn("@warehouse/organizations/removeProduct")(function* (productId: string) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);

      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const orgId = yield* OrganizationId;

      const exists = yield* db.query.TB_organizations_products.findFirst({
        where: (organization_products, operations) =>
          and(
            operations.eq(organization_products.organizationId, orgId),
            operations.eq(organization_products.productId, parsedProductId.output),
          ),
      });

      if (!exists) {
        return yield* Effect.fail(
          new OrganizationProductNotFound({ productId: parsedProductId.output, organizationId: orgId }),
        );
      }

      return yield* db
        .update(TB_organizations_products)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(TB_organizations_products.organizationId, orgId),
            eq(TB_organizations_products.productId, parsedProductId.output),
          ),
        )
        .returning();
    });

    const reAddProduct = Effect.fn("@warehouse/organizations/reAddProduct")(function* (productId: string) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);

      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }
      const orgId = yield* OrganizationId;

      const exists = yield* db.query.TB_organizations_products.findFirst({
        where: (organization_products, operations) =>
          and(
            operations.eq(organization_products.organizationId, orgId),
            operations.eq(organization_products.productId, parsedProductId.output),
          ),
      });

      if (!exists) {
        return yield* Effect.fail(
          new OrganizationProductNotFound({ productId: parsedProductId.output, organizationId: orgId }),
        );
      }

      return yield* db
        .update(TB_organizations_products)
        .set({ deletedAt: null })
        .where(
          and(
            eq(TB_organizations_products.organizationId, orgId),
            eq(TB_organizations_products.productId, parsedProductId.output),
          ),
        )
        .returning();
    });

    const addProduct = Effect.fn("@warehouse/organizations/addProduct")(function* (
      data: InferInput<typeof OrganizationProductCreateSchema>,
      productId: string,
    ) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);

      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const orgId = yield* OrganizationId;

      const exists = yield* db.query.TB_organizations_products.findFirst({
        where: (organization_products, operations) =>
          and(
            operations.eq(organization_products.organizationId, orgId),
            operations.eq(organization_products.productId, parsedProductId.output),
          ),
      });

      if (exists) {
        return yield* db
          .update(TB_organizations_products)
          .set({ deletedAt: null })
          .where(
            and(
              eq(TB_organizations_products.organizationId, orgId),
              eq(TB_organizations_products.productId, parsedProductId.output),
            ),
          )
          .returning();
      }

      return yield* db
        .insert(TB_organizations_products)
        .values({ ...data, organizationId: orgId, productId: parsedProductId.output })
        .returning();
    });

    const findProductById = Effect.fn("@warehouse/organizations/findProductById")(function* (productId: string) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);

      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const orgId = yield* OrganizationId;

      const orgP = yield* db.query.TB_organizations_products.findFirst({
        where: (organization_products, operations) =>
          and(
            operations.eq(organization_products.organizationId, orgId),
            operations.eq(organization_products.productId, parsedProductId.output),
          ),
      });
      if (!orgP) {
        return yield* Effect.fail(new OrganizationProductNotFound({ productId: productId, organizationId: orgId }));
      }
      return orgP;
    });

    const getDashboardData = Effect.fn("@warehouse/organizations/getDashboardData")(function* () {
      const orgId = yield* OrganizationId;
      const org = yield* db.query.TB_organizations.findFirst({
        where: (fields, operations) => operations.eq(fields.id, orgId),
        with: {
          products: {
            with: {
              product: true,
            },
          },
          supps: {
            with: {
              supplier: true,
            },
          },
          customers: {
            with: {
              customer: true,
            },
          },
          customerOrders: {
            with: {
              customer: true,
              products: {
                with: {
                  product: true,
                },
              },
              sale: true,
            },
          },
          purchases: {
            with: {
              supplier: true,
              products: {
                with: {
                  product: true,
                },
              },
            },
          },
          devices: {
            with: {
              type: true,
            },
          },
          sales: {
            with: {
              sale: true,
            },
          },
          catalogs: true,
          owner: {
            columns: {
              hashed_password: false,
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
        },
      });
      if (!org) {
        return yield* Effect.fail(new OrganizationNotFound({ id: orgId }));
      }
      return org;
    });

    const updateProduct = Effect.fn("@warehouse/organizations/updateProduct")(function* (
      productId: string,
      data: Omit<InferInput<typeof OrganizationProductUpdateSchema>, "productId" | "organizationId">,
    ) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new OrganizationProductInvalidId({ id: productId }));
      }
      const orgId = yield* OrganizationId;
      const [updated] = yield* db
        .update(TB_organizations_products)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(TB_organizations_products.productId, parsedProductId.output),
            eq(TB_organizations_products.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated) {
        return yield* Effect.fail(new OrganizationProductNotUpdated({ productId, organizationId: orgId }));
      }

      return updated;
    });

    const all = Effect.fn("@warehouse/organizations/all")(function* () {
      return yield* db.query.TB_organizations.findMany();
    });

    return {
      all,
      create,
      findById,
      findBySlug,
      findByUserId,
      update,
      remove,
      safeRemove,
      addUser,
      removeUser,
      users,
      updateProduct,
      addCustomerOrder,
      removeCustomerOrder,
      addSupplierPurchase,
      removeSupplierPurchase,
      findProductById,
      removeProduct,
      reAddProduct,
      addProduct,
      getDashboardData,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrganizationLive = OrganizationService.Default;

// Type exports
export type OrganizationInfo = NonNullable<Effect.Effect.Success<Awaited<ReturnType<OrganizationService["findById"]>>>>;
