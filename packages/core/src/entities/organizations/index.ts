import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
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

export class OrganizationService extends Effect.Service<OrganizationService>()("@warehouse/organizations", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
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

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_organizations.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
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
            user: true,
          },
        },
        owner: true,
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
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof OrganizationCreateSchema>, userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
        }

        const slug = generateSlug(userInput.name);
        const exists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.slug, slug),
          }),
        );

        if (exists) {
          return yield* Effect.fail(new OrganizationAlreadyExists({ name: userInput.name, slug }));
        }

        const [org] = yield* Effect.promise(() =>
          db
            .insert(TB_organizations)
            .values({ ...userInput, owner_id: parsedUserId.output, slug: generateSlug(userInput.name) })
            .returning(),
        );
        // TODO: Add organization to user's organizations
        const added = yield* addUser(userId, org.id);
        if (!added) {
          return yield* Effect.fail(
            new OrganizationUserAddFailed({ userId: parsedUserId.output, organizationId: org.id }),
          );
        }
        return org;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id }));
        }

        const org = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
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
          }),
        );
        if (!org) {
          return yield* Effect.fail(new OrganizationNotFound({ id }));
        }
        return org;
      });

    const findBySlug = (slug: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
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
          }),
        );
      });

    const update = (input: InferInput<typeof OrganizationUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new OrganizationNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ deletedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrganizationNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ deletedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrganizationNotDeleted({ id }));
        }

        return deleted;
      });

    const addUser = (userId: string, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
        }

        const org = yield* findById(organizationId);
        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, parsedUserId.output),
          }),
        );

        if (!user) {
          return yield* Effect.fail(new OrganizationUserNotFound({ userId }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_organization_users.findFirst({
            where: (organization_users, operations) =>
              and(
                operations.eq(organization_users.user_id, parsedUserId.output),
                operations.eq(organization_users.organization_id, organizationId),
              ),
          }),
        );

        if (exists) {
          return yield* Effect.fail(new OrganizationUserAlreadyExists({ userId, organizationId }));
        }

        const [entry] = yield* Effect.promise(() =>
          db
            .insert(TB_organization_users)
            .values({ user_id: parsedUserId.output, organization_id: organizationId })
            .returning(),
        );

        if (!entry) {
          return yield* Effect.fail(new OrganizationUserAddFailed({ userId, organizationId }));
        }

        return entry;
      });

    const removeUser = (organizationId: string, userId: string) =>
      Effect.gen(function* (_) {
        const org = yield* findById(organizationId);
        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, userId),
          }),
        );

        if (!user) {
          return yield* Effect.fail(new OrganizationUserNotFound({ userId }));
        }

        const [removed] = yield* Effect.promise(() =>
          db
            .delete(TB_organization_users)
            .where(
              and(eq(TB_organization_users.user_id, userId), eq(TB_organization_users.organization_id, organizationId)),
            )
            .returning(),
        );

        if (!removed) {
          return yield* Effect.fail(new OrganizationUserRemoveFailed({ userId, organizationId }));
        }

        return removed;
      });

    const users = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const organizationExists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.id, parsedOrganizationId.output),
          }),
        );

        if (!organizationExists) {
          return yield* Effect.fail(new OrganizationNotFound({ id: organizationId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_organization_users.findMany({
            where: (organization_users, operations) =>
              operations.eq(organization_users.organization_id, parsedOrganizationId.output),
            with: {
              user: true,
            },
          }),
        );
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationUserInvalidId({ userId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_organizations.findMany({
            where: (organizations, operations) => operations.eq(organizations.owner_id, parsedId.output),
            with: relations,
          }),
        );
      });

    const addCustomerOrder = (
      data: InferInput<typeof CustomerOrderCreateSchema>,
      organizationId: string,
      orderId: string,
      customerId: string,
    ) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedOrderId = safeParse(prefixed_cuid2, orderId);
        const parsedCustomerId = safeParse(prefixed_cuid2, customerId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedOrderId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
        }
        if (!parsedCustomerId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
        }

        return yield* Effect.promise(() =>
          db
            .insert(TB_customer_orders)
            .values({
              ...data,
              organization_id: parsedOrgId.output,
              customer_id: parsedCustomerId.output,
              id: parsedOrderId.output,
            })
            .returning(),
        );
      });

    const removeCustomerOrder = (organizationId: string, orderId: string, customerId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedOrderId = safeParse(prefixed_cuid2, orderId);
        const parsedCustomerId = safeParse(prefixed_cuid2, customerId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedOrderId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
        }
        if (!parsedCustomerId.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id: customerId }));
        }

        return yield* Effect.promise(() =>
          db
            .delete(TB_customer_orders)
            .where(
              and(
                eq(TB_customer_orders.organization_id, parsedOrgId.output),
                eq(TB_customer_orders.id, parsedOrderId.output),
                eq(TB_customer_orders.customer_id, parsedCustomerId.output),
              ),
            )
            .returning(),
        );
      });

    const addSupplierPurchase = (
      data: InferInput<typeof SupplierPurchaseCreateSchema>,
      organizationId: string,
      supplierId: string,
    ) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedSupplierId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: supplierId }));
        }

        const [purchase] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_purchases)
            .values({
              ...data,
              organization_id: parsedOrgId.output,
            })
            .returning(),
        );

        if (!purchase) {
          return yield* Effect.fail(new SupplierPurchaseNotCreated({}));
        }
        return purchase;
      });

    const removeSupplierPurchase = (organizationId: string, supplierPurchaseId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedSupplierPurchaseId = safeParse(prefixed_cuid2, supplierPurchaseId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedSupplierPurchaseId.success) {
          return yield* Effect.fail(new SupplierPurchaseInvalidId({ id: supplierPurchaseId }));
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_supplier_purchases)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(TB_supplier_purchases.organization_id, parsedOrgId.output),
                eq(TB_supplier_purchases.id, parsedSupplierPurchaseId.output),
              ),
            )
            .returning(),
        );
      });

    const removeProduct = (organizationId: string, productId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedProductId = safeParse(prefixed_cuid2, productId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (organization_products, operations) =>
              and(
                operations.eq(organization_products.organizationId, parsedOrgId.output),
                operations.eq(organization_products.productId, parsedProductId.output),
              ),
          }),
        );

        if (!exists) {
          return yield* Effect.fail(
            new OrganizationProductNotFound({ productId: parsedProductId.output, organizationId: parsedOrgId.output }),
          );
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_organizations_products)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(TB_organizations_products.organizationId, parsedOrgId.output),
                eq(TB_organizations_products.productId, parsedProductId.output),
              ),
            )
            .returning(),
        );
      });

    const reAddProduct = (organizationId: string, productId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedProductId = safeParse(prefixed_cuid2, productId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (organization_products, operations) =>
              and(
                operations.eq(organization_products.organizationId, parsedOrgId.output),
                operations.eq(organization_products.productId, parsedProductId.output),
              ),
          }),
        );

        if (!exists) {
          return yield* Effect.fail(
            new OrganizationProductNotFound({ productId: parsedProductId.output, organizationId: parsedOrgId.output }),
          );
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_organizations_products)
            .set({ deletedAt: null })
            .where(
              and(
                eq(TB_organizations_products.organizationId, parsedOrgId.output),
                eq(TB_organizations_products.productId, parsedProductId.output),
              ),
            )
            .returning(),
        );
      });

    const addProduct = (
      data: InferInput<typeof OrganizationProductCreateSchema>,
      organizationId: string,
      productId: string,
    ) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedProductId = safeParse(prefixed_cuid2, productId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (organization_products, operations) =>
              and(
                operations.eq(organization_products.organizationId, parsedOrgId.output),
                operations.eq(organization_products.productId, parsedProductId.output),
              ),
          }),
        );

        if (exists) {
          return yield* Effect.promise(() =>
            db
              .update(TB_organizations_products)
              .set({ deletedAt: null })
              .where(
                and(
                  eq(TB_organizations_products.organizationId, parsedOrgId.output),
                  eq(TB_organizations_products.productId, parsedProductId.output),
                ),
              )
              .returning(),
          );
        }

        return yield* Effect.promise(() =>
          db
            .insert(TB_organizations_products)
            .values({ ...data, organizationId: parsedOrgId.output, productId: parsedProductId.output })
            .returning(),
        );
      });

    const findProductById = (organizationId: string, productId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedProductId = safeParse(prefixed_cuid2, productId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }
        const orgP = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (organization_products, operations) =>
              and(
                operations.eq(organization_products.organizationId, parsedOrgId.output),
                operations.eq(organization_products.productId, parsedProductId.output),
              ),
          }),
        );
        if (!orgP) {
          return yield* Effect.fail(
            new OrganizationProductNotFound({ productId: productId, organizationId: organizationId }),
          );
        }
        return orgP;
      });

    const getDashboardData = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const org = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedOrganizationId.output),
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
          }),
        );
        if (!org) {
          return yield* Effect.fail(new OrganizationNotFound({ id: organizationId }));
        }
        return org;
      });

    const updateProduct = (
      productId: string,
      orgId: string,
      data: Omit<InferInput<typeof OrganizationProductUpdateSchema>, "productId" | "organizationId">,
    ) =>
      Effect.gen(function* (_) {
        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new OrganizationProductInvalidId({ id: productId }));
        }

        const parsedOrganizationId = safeParse(prefixed_cuid2, orgId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_organizations_products)
            .set({ ...data, updatedAt: new Date() })
            .where(
              and(
                eq(TB_organizations_products.productId, parsedProductId.output),
                eq(TB_organizations_products.organizationId, parsedOrganizationId.output),
              ),
            )
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(
            new OrganizationProductNotUpdated({ productId, organizationId: parsedOrganizationId.output }),
          );
        }

        return updated;
      });

    return {
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
