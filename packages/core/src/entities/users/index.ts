import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { Effect } from "effect";
import { array, email, InferInput, object, omit, parse, pipe, safeParse, string } from "valibot";
import org_wh from "../../data/org_wh.json";
import user_orgs from "../../data/user_orgs.json";
import user_wh from "../../data/user_wh.json";
import users from "../../data/users.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  TB_organization_users,
  TB_organizations_warehouses,
  TB_users,
  TB_users_warehouses,
  UserCreateSchema,
  UserUpdateSchema,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationLive, OrganizationService } from "../organizations";
import { WarehouseLive, WarehouseService } from "../warehouses";
import {
  UserAuthenticationFailed,
  UserDisableFailed,
  UserInvalidEmail,
  UserInvalidId,
  UserLastFacilityNotFound,
  UserLastOrgNotFound,
  UserLastWarehouseNotFound,
  UserNotCreated,
  UserNotDeleted,
  UserNotFound,
  UserNotUpdated,
  UserPasswordRequired,
} from "./errors";

export class UserService extends Effect.Service<UserService>()("@warehouse/users", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    const hashPassword = (password: string) => createHash("sha256").update(password).digest("hex");
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_users.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        payment_methods: {
          with: {
            payment_method: true,
          },
        },
        payment_history: {
          with: {
            paymentMethod: true,
          },
        },
        orgs: {
          with: {
            org: {
              with: {
                catalogs: {
                  with: {
                    products: {
                      with: {
                        product: true,
                      },
                    },
                  },
                },
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
                whs: {
                  with: {
                    warehouse: {
                      with: {
                        addresses: {
                          with: {
                            address: true,
                          },
                        },
                        owner: {
                          columns: {
                            hashed_password: false,
                          },
                        },
                        orders: {
                          with: {
                            order: true,
                          },
                        },
                        products: {
                          with: {
                            product: true,
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
                        fcs: {
                          with: {
                            ars: {
                              with: {
                                strs: {
                                  with: {
                                    type: true,
                                    area: true,
                                    invs: {
                                      with: {
                                        labels: true,
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
                owner: {
                  columns: {
                    hashed_password: false,
                  },
                },
                orders: {
                  with: {
                    order: true,
                  },
                },
                products: {
                  with: {
                    product: true,
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
                fcs: {
                  with: {
                    ars: {
                      with: {
                        strs: {
                          with: {
                            type: true,
                            area: true,
                            invs: {
                              with: {
                                labels: true,
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
        sessions: {
          with: {
            user: {
              columns: {
                hashed_password: false,
              },
            },
            org: {
              with: {
                catalogs: {
                  with: {
                    products: {
                      with: {
                        product: true,
                      },
                    },
                  },
                },
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
                whs: {
                  with: {
                    warehouse: {
                      with: {
                        addresses: {
                          with: {
                            address: true,
                          },
                        },
                        owner: {
                          columns: {
                            hashed_password: false,
                          },
                        },
                        orders: {
                          with: {
                            order: true,
                          },
                        },
                        products: {
                          with: {
                            product: true,
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
                        fcs: {
                          with: {
                            ars: {
                              with: {
                                strs: {
                                  with: {
                                    type: true,
                                    area: true,
                                    invs: {
                                      with: {
                                        labels: true,
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
            wh: {
              with: {
                addresses: {
                  with: {
                    address: true,
                  },
                },
                owner: {
                  columns: {
                    hashed_password: false,
                  },
                },
                orders: {
                  with: {
                    order: true,
                  },
                },
                products: {
                  with: {
                    product: true,
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
                fcs: {
                  with: {
                    ars: {
                      with: {
                        strs: {
                          with: {
                            type: true,
                            area: true,
                            invs: {
                              with: {
                                labels: true,
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
            fc: {
              with: {
                ars: {
                  with: {
                    strs: {
                      with: {
                        type: true,
                        area: true,
                        invs: {
                          with: {
                            labels: true,
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

    const create = (userInput: InferInput<typeof UserCreateSchema>) =>
      Effect.gen(function* (_) {
        const WithHashedPassword = object({
          ...omit(UserCreateSchema, ["password"]).entries,
          hashed_password: string(),
        });
        let uI: InferInput<typeof WithHashedPassword>;
        const { password, ...cleanedUserInput } = userInput;
        if (!password) {
          return yield* Effect.fail(new UserPasswordRequired({}));
        }
        uI = Object.assign(cleanedUserInput, {
          hashed_password: hashPassword(password),
        });

        const [x] = yield* Effect.promise(() => db.insert(TB_users).values(uI).returning());
        if (!x) {
          return yield* Effect.fail(new UserNotCreated({}));
        }

        const user = yield* findById(x.id);
        if (!user) {
          return yield* Effect.fail(new UserNotCreated({ message: "Failed to create user" }));
        }

        return user;
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id }));
        }

        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              payment_methods: {
                with: {
                  payment_method: true,
                },
              },
              payment_history: {
                with: {
                  paymentMethod: true,
                },
              },
              orgs: {
                with: {
                  org: {
                    with: {
                      catalogs: {
                        with: {
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
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
                      whs: {
                        with: {
                          warehouse: {
                            with: {
                              addresses: {
                                with: {
                                  address: true,
                                },
                              },
                              owner: {
                                columns: {
                                  hashed_password: false,
                                },
                              },
                              orders: {
                                with: {
                                  order: true,
                                },
                              },
                              products: {
                                with: {
                                  product: true,
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
                              fcs: {
                                with: {
                                  ars: {
                                    with: {
                                      strs: {
                                        with: {
                                          type: true,
                                          area: true,
                                          invs: {
                                            with: {
                                              labels: true,
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
                      owner: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                      orders: {
                        with: {
                          order: true,
                        },
                      },
                      products: {
                        with: {
                          product: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  area: true,
                                  invs: {
                                    with: {
                                      labels: true,
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
              sessions: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                    with: {
                      sessions: {
                        with: {
                          user: {
                            columns: {
                              hashed_password: false,
                            },
                          },
                        },
                      },
                    },
                  },
                  org: {
                    with: {
                      catalogs: {
                        with: {
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
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
                      whs: {
                        with: {
                          warehouse: {
                            with: {
                              addresses: {
                                with: {
                                  address: true,
                                },
                              },
                              owner: {
                                columns: {
                                  hashed_password: false,
                                },
                              },
                              orders: {
                                with: {
                                  order: true,
                                },
                              },
                              products: {
                                with: {
                                  product: true,
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
                              fcs: {
                                with: {
                                  ars: {
                                    with: {
                                      strs: {
                                        with: {
                                          type: true,
                                          area: true,
                                          invs: {
                                            with: {
                                              labels: true,
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
                  wh: {
                    with: {
                      addresses: {
                        with: {
                          address: true,
                        },
                      },
                      owner: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                      orders: {
                        with: {
                          order: true,
                        },
                      },
                      products: {
                        with: {
                          product: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  area: true,
                                  invs: {
                                    with: {
                                      labels: true,
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
                  fc: {
                    with: {
                      ars: {
                        with: {
                          strs: {
                            with: {
                              type: true,
                              area: true,
                              invs: {
                                with: {
                                  labels: true,
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
            columns: {
              hashed_password: false,
            },
          }),
        );

        if (!user) {
          return yield* Effect.fail(new UserNotFound({ id }));
        }

        return user;
      });

    const findByEmail = (emailInput: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const emailX = pipe(string(), email());
        const parsedEmail = safeParse(emailX, emailInput);
        if (!parsedEmail.success) {
          return yield* Effect.fail(new UserInvalidEmail({ email: emailInput }));
        }

        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (fields, operations) => operations.eq(fields.email, parsedEmail.output),
            with: {
              payment_methods: {
                with: {
                  payment_method: true,
                },
              },
              payment_history: {
                with: {
                  paymentMethod: true,
                },
              },
              orgs: {
                with: {
                  org: {
                    with: {
                      catalogs: {
                        with: {
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
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
                      whs: {
                        with: {
                          warehouse: {
                            with: {
                              addresses: {
                                with: {
                                  address: true,
                                },
                              },
                              owner: {
                                columns: {
                                  hashed_password: false,
                                },
                              },
                              orders: {
                                with: {
                                  order: true,
                                },
                              },
                              products: {
                                with: {
                                  product: true,
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
                              fcs: {
                                with: {
                                  ars: {
                                    with: {
                                      strs: {
                                        with: {
                                          type: true,
                                          area: true,
                                          invs: {
                                            with: {
                                              labels: true,
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
                      owner: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                      orders: {
                        with: {
                          order: true,
                        },
                      },
                      products: {
                        with: {
                          product: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  area: true,
                                  invs: {
                                    with: {
                                      labels: true,
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
              sessions: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                    with: {
                      sessions: {
                        with: {
                          user: {
                            columns: {
                              hashed_password: false,
                            },
                          },
                        },
                      },
                    },
                  },
                  org: {
                    with: {
                      catalogs: {
                        with: {
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
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
                      whs: {
                        with: {
                          warehouse: {
                            with: {
                              addresses: {
                                with: {
                                  address: true,
                                },
                              },
                              owner: {
                                columns: {
                                  hashed_password: false,
                                },
                              },
                              orders: {
                                with: {
                                  order: true,
                                },
                              },
                              products: {
                                with: {
                                  product: true,
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
                              fcs: {
                                with: {
                                  ars: {
                                    with: {
                                      strs: {
                                        with: {
                                          type: true,
                                          area: true,
                                          invs: {
                                            with: {
                                              labels: true,
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
                  wh: {
                    with: {
                      addresses: {
                        with: {
                          address: true,
                        },
                      },
                      owner: {
                        columns: {
                          hashed_password: false,
                        },
                      },
                      orders: {
                        with: {
                          order: true,
                        },
                      },
                      products: {
                        with: {
                          product: true,
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
                      fcs: {
                        with: {
                          ars: {
                            with: {
                              strs: {
                                with: {
                                  type: true,
                                  area: true,
                                  invs: {
                                    with: {
                                      labels: true,
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
                  fc: {
                    with: {
                      ars: {
                        with: {
                          strs: {
                            with: {
                              type: true,
                              area: true,
                              invs: {
                                with: {
                                  labels: true,
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
            columns: {
              hashed_password: false,
            },
          }),
        );

        if (!user) {
          return yield* Effect.fail(new UserNotFound({ id: emailInput }));
        }

        return user;
      });

    const update = (id: string, userInput: InferInput<typeof UserUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id }));
        }
        const [updatedUser] = yield* Effect.promise(() =>
          db
            .update(TB_users)
            .set({ ...userInput, updatedAt: new Date() })
            .where(eq(TB_users.id, parsedId.output))
            .returning(),
        );
        if (!updatedUser) {
          return yield* Effect.fail(new UserNotUpdated({ id }));
        }
        return updatedUser;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id }));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.delete(TB_users).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        if (!deletedUser) {
          return yield* Effect.fail(new UserNotDeleted({ id }));
        }
        return deletedUser;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id }));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.update(TB_users).set({ deletedAt: new Date() }).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        if (!deletedUser) {
          return yield* Effect.fail(new UserNotDeleted({ id }));
        }
        return deletedUser;
      });

    const notify = (message: string) =>
      Effect.gen(function* (_) {
        return message;
      });

    const disable = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id }));
        }
        const [updatedUser] = yield* Effect.promise(() =>
          db.update(TB_users).set({ status: "disabled" }).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        if (!updatedUser) {
          return yield* Effect.fail(new UserDisableFailed({ id }));
        }
        return updatedUser;
      });

    const verifyPassword = (emailInput: string, password: string) =>
      Effect.gen(function* (_) {
        const parsedEmail = safeParse(pipe(string(), email()), emailInput);
        if (!parsedEmail.success) {
          return yield* Effect.fail(new UserInvalidEmail({ email: emailInput }));
        }

        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) =>
              operations.and(
                operations.eq(users.email, parsedEmail.output),
                operations.eq(users.hashed_password, hashPassword(password)),
              ),
          }),
        );

        if (!user) {
          return yield* Effect.fail(new UserAuthenticationFailed({ email: emailInput }));
        }

        return true;
      });

    const findLastOrganization = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new UserInvalidId({ id: userId }));
        }
        const org = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (users_warehouses, operations) => operations.eq(users_warehouses.owner_id, parsedUserId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
          }),
        );
        if (!org) {
          return yield* Effect.fail(new UserLastOrgNotFound({ userId }));
        }
        return org;
      });

    const findLastWarehouse = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new UserInvalidId({ id: userId }));
        }
        const warehouse = yield* Effect.promise(() =>
          db.query.TB_warehouses.findFirst({
            where: (users_warehouses, operations) => operations.eq(users_warehouses.ownerId, parsedUserId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
          }),
        );
        if (!warehouse) {
          return yield* Effect.fail(new UserLastWarehouseNotFound({ userId }));
        }
        return warehouse;
      });

    const findLastFacility = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new UserInvalidId({ id: userId }));
        }

        const facility = yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findFirst({
            where: (fields, operations) => operations.eq(fields.ownerId, parsedUserId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
          }),
        );
        if (!facility) {
          return yield* Effect.fail(new UserLastFacilityNotFound({ userId }));
        }
        return facility;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbUsers = yield* Effect.promise(() => db.query.TB_users.findMany());

        const originalSchema = object({
          ...omit(createInsertSchema(TB_users), ["createdAt", "updatedAt"]).entries,
          id: prefixed_cuid2,
        });

        const us = parse(array(originalSchema), users);

        const existing = dbUsers.map((u) => u.id);

        const toCreate = us.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_users).values(toCreate).returning());
          yield* Effect.log("Created users", toCreate);
        }

        const toUpdate = us.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const user of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_users)
                .set({ ...user, updatedAt: new Date() })
                .where(eq(TB_users.id, user.id))
                .returning(),
            );
          }
        }

        // TODO: Add users to organizations
        const orgsService = yield* _(OrganizationService);
        const orgs = yield* orgsService.seed();

        const userOrgs = parse(
          array(
            object({
              organization_id: prefixed_cuid2,
              user_id: prefixed_cuid2,
            }),
          ),
          user_orgs,
        );
        const existingUserOrgs = yield* Effect.promise(() => db.query.TB_organization_users.findMany());
        const existingUserOrgsIds = existingUserOrgs.map((u) => u.user_id);
        const toCreateUserOrgs = userOrgs.filter((t) => !existingUserOrgsIds.includes(t.user_id));
        if (toCreateUserOrgs.length > 0) {
          yield* Effect.promise(() => db.insert(TB_organization_users).values(toCreateUserOrgs).returning());
        }

        // TODO: Add users to warehouses
        const whsService = yield* _(WarehouseService);
        const whs = yield* whsService.seed();

        const userWhs = parse(
          array(
            object({
              userId: prefixed_cuid2,
              warehouseId: prefixed_cuid2,
            }),
          ),
          user_wh,
        );
        const existingUserWhs = yield* Effect.promise(() => db.query.TB_users_warehouses.findMany());
        const existingUserWhsIds = existingUserWhs.map((u) => u.userId);
        const toCreateUserWhs = userWhs.filter((t) => !existingUserWhsIds.includes(t.userId));
        if (toCreateUserWhs.length > 0) {
          yield* Effect.promise(() => db.insert(TB_users_warehouses).values(toCreateUserWhs).returning());
        }

        const orgWhs = parse(
          array(
            object({
              organizationId: prefixed_cuid2,
              warehouseId: prefixed_cuid2,
            }),
          ),
          org_wh,
        );
        const existingOrgWhs = yield* Effect.promise(() => db.query.TB_organizations_warehouses.findMany());
        const existingOrgWhsIds = existingOrgWhs.map((u) => u.organizationId);
        const toCreateOrgWhs = orgWhs.filter((t) => !existingOrgWhsIds.includes(t.organizationId));
        if (toCreateOrgWhs.length > 0) {
          yield* Effect.promise(() => db.insert(TB_organizations_warehouses).values(toCreateOrgWhs).returning());
        }
        return us;
      });

    return {
      create,
      disable,
      findById,
      findByEmail,
      update,
      remove,
      safeRemove,
      notify,
      verifyPassword,
      findLastOrganization,
      findLastWarehouse,
      findLastFacility,
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive, OrganizationLive, WarehouseLive],
}) {}

export const UserLive = UserService.Default;
export type UserInfo = NonNullable<Effect.Effect.Success<ReturnType<UserService["findById"]>>>;
