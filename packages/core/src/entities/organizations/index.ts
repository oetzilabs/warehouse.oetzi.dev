import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  OrganizationCreateSchema,
  OrganizationUpdateSchema,
  TB_organization_users,
  TB_organizations,
  TB_organizations_customerorders,
  TB_organizations_products,
  TB_organizations_supplierorders,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { CustomerInvalidId } from "../customers/errors";
import { OrderInvalidId } from "../orders/errors";
import { ProductInvalidId } from "../products/errors";
import { SupplierInvalidId } from "../suppliers/errors";
import {
  OrganizationAlreadyExists,
  OrganizationInvalidId,
  OrganizationNotDeleted,
  OrganizationNotFound,
  OrganizationNotUpdated,
  OrganizationProductNotAdded,
  OrganizationProductNotFound,
  OrganizationProductNotRemoved,
  OrganizationTaxRateNotFound,
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
            order: true,
          },
        },
        purchases: {
          with: {
            order: true,
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
                fcs: {
                  with: {
                    ars: {
                      with: {
                        strs: {
                          with: {
                            type: true,
                            invs: {
                              with: {
                                labels: true,
                                products: {
                                  with: {
                                    product: true,
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
                  order: {
                    with: {
                      prods: {
                        with: {
                          product: {
                            with: {
                              brands: true,
                              warehouses: {
                                with: {
                                  warehouse: true,
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
              purchases: {
                with: {
                  order: {
                    with: {
                      prods: {
                        with: {
                          product: {
                            with: {
                              brands: true,
                              warehouses: {
                                with: {
                                  warehouse: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  invs: {
                                    with: {
                                      labels: true,
                                      products: {
                                        with: {
                                          product: true,
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
                  order: true,
                },
              },
              purchases: {
                with: {
                  order: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  invs: {
                                    with: {
                                      labels: true,
                                      products: {
                                        with: {
                                          product: true,
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

    const addCustomerOrder = (organizationId: string, orderId: string, customerId: string) =>
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
            .insert(TB_organizations_customerorders)
            .values({
              organization_id: parsedOrgId.output,
              order_id: parsedOrderId.output,
              customer_id: parsedCustomerId.output,
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
            .delete(TB_organizations_customerorders)
            .where(
              and(
                eq(TB_organizations_customerorders.organization_id, parsedOrgId.output),
                eq(TB_organizations_customerorders.order_id, parsedOrderId.output),
                eq(TB_organizations_customerorders.customer_id, parsedCustomerId.output),
              ),
            )
            .returning(),
        );
      });

    const addSupplierOrder = (organizationId: string, orderId: string, supplierId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedOrderId = safeParse(prefixed_cuid2, orderId);
        const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedOrderId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
        }
        if (!parsedSupplierId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: supplierId }));
        }

        return yield* Effect.promise(() =>
          db
            .insert(TB_organizations_supplierorders)
            .values({
              organization_id: parsedOrgId.output,
              order_id: parsedOrderId.output,
              supplier_id: parsedSupplierId.output,
            })
            .returning(),
        );
      });

    const removeSupplierOrder = (organizationId: string, orderId: string, supplierId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        const parsedOrderId = safeParse(prefixed_cuid2, orderId);
        const parsedSupplierId = safeParse(prefixed_cuid2, supplierId);

        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        if (!parsedOrderId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: orderId }));
        }
        if (!parsedSupplierId.success) {
          return yield* Effect.fail(new SupplierInvalidId({ id: supplierId }));
        }

        return yield* Effect.promise(() =>
          db
            .delete(TB_organizations_supplierorders)
            .where(
              and(
                eq(TB_organizations_supplierorders.organization_id, parsedOrgId.output),
                eq(TB_organizations_supplierorders.order_id, parsedOrderId.output),
                eq(TB_organizations_supplierorders.supplier_id, parsedSupplierId.output),
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

    const addProduct = (organizationId: string, productId: string) =>
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
            .values({ organizationId: parsedOrgId.output, productId: parsedProductId.output })
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

        return yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (organization_products, operations) =>
              and(
                operations.eq(organization_products.organizationId, parsedOrgId.output),
                operations.eq(organization_products.productId, parsedProductId.output),
              ),
          }),
        );
      });

    const getInventory = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const organization = yield* findById(organizationId);
        if (!organization) {
          return yield* Effect.fail(new OrganizationNotFound({ id: organizationId }));
        }

        const warehouseSummary = organization.whs.map((wh) => {
          return {
            id: wh.warehouse.id,
            name: wh.warehouse.name,
            description: wh.warehouse.description,
            dimensions: wh.warehouse.dimensions,
            createdAt: wh.warehouse.createdAt,
            updatedAt: wh.warehouse.updatedAt,
            deletedAt: wh.warehouse.deletedAt,
            facilities: wh.warehouse.fcs.map((facility) => ({
              id: facility.id,
              name: facility.name,
              description: facility.description,
              boundingBox: facility.bounding_box,
              createdAt: facility.createdAt,
              updatedAt: facility.updatedAt,
              deletedAt: facility.deletedAt,
              areas: facility.ars.map((area) => ({
                id: area.id,
                name: area.name,
                description: area.description,
                boundingBox: area.bounding_box,
                createdAt: area.createdAt,
                updatedAt: area.updatedAt,
                deletedAt: area.deletedAt,
                storages: area.strs.map((storage) => ({
                  id: storage.id,
                  name: storage.name,
                  description: storage.description,
                  type: storage.type,
                  capacity: storage.capacity,
                  currentOccupancy: storage.currentOccupancy,
                  variant: storage.variant,
                  boundingBox: storage.bounding_box,
                  createdAt: storage.createdAt,
                  updatedAt: storage.updatedAt,
                  deletedAt: storage.deletedAt,
                  spaces: storage.invs.map((space) => ({
                    id: space.id,
                    name: space.name,
                    barcode: space.barcode,
                    dimensions: space.dimensions,
                    productCapacity: space.productCapacity,
                    createdAt: space.createdAt,
                    updatedAt: space.updatedAt,
                    deletedAt: space.deletedAt,
                    products: space.products.map((p) => ({
                      id: p.product.id,
                      name: p.product.name,
                      sku: p.product.sku,
                      barcode: p.product.barcode,
                      createdAt: p.product.createdAt,
                      updatedAt: p.product.updatedAt,
                      deletedAt: p.product.deletedAt,
                      stock: space.products.filter((p2) => p2.product.id === p.product.id).length,
                      minStock: p.product.minimumStock,
                      maxStock: p.product.maximumStock,
                      reorderPoint: p.product.reorderPoint,
                      safetyStock: p.product.safetyStock,
                    })),
                  })),
                })),
              })),
            })),
          };
        });

        const summary = {
          id: organization.id,
          name: organization.name,
          totalWarehouses: organization.whs.length,
          warehouses: warehouseSummary,
          stats: {
            totalFacilities: warehouseSummary.reduce((acc, wh) => acc + wh.facilities.length, 0),
            totalAreas: warehouseSummary.reduce(
              (acc, wh) => acc + wh.facilities.reduce((facc, f) => facc + f.areas.length, 0),
              0,
            ),
            totalStorages: warehouseSummary.reduce(
              (acc, wh) =>
                acc +
                wh.facilities.reduce((facc, f) => facc + f.areas.reduce((aacc, a) => aacc + a.storages.length, 0), 0),
              0,
            ),
            totalSpaces: warehouseSummary.reduce(
              (acc, wh) =>
                acc +
                wh.facilities.reduce(
                  (facc, f) =>
                    facc +
                    f.areas.reduce((aacc, a) => aacc + a.storages.reduce((sacc, s) => sacc + s.spaces.length, 0), 0),
                  0,
                ),
              0,
            ),
            totalProducts: warehouseSummary.reduce(
              (acc, wh) =>
                acc +
                wh.facilities.reduce(
                  (facc, f) =>
                    facc +
                    f.areas.reduce(
                      (aacc, a) =>
                        aacc +
                        a.storages.reduce(
                          (sacc, s) => sacc + s.spaces.reduce((spacc, sp) => spacc + sp.products.length, 0),
                          0,
                        ),
                      0,
                    ),
                  0,
                ),
              0,
            ),
          },
        };

        return summary;
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
      addCustomerOrder,
      removeCustomerOrder,
      addSupplierOrder,
      removeSupplierOrder,
      findProductById,
      removeProduct,
      addProduct,
      getInventory,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrganizationLive = OrganizationService.Default;

// Type exports
export type OrganizationInfo = NonNullable<Effect.Effect.Success<Awaited<ReturnType<OrganizationService["findById"]>>>>;
export type OrganizationInventoryInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<OrganizationService["getInventory"]>>>
>;
