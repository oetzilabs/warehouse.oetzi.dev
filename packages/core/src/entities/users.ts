import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { Effect } from "effect";
import { array, email, InferInput, object, omit, parse, pipe, safeParse, string } from "valibot";
import org_wh from "../data/org_wh.json";
import user_orgs from "../data/user_orgs.json";
import user_wh from "../data/user_wh.json";
import users from "../data/users.json";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  TB_organization_users,
  TB_organizations_warehouses,
  TB_users,
  TB_users_warehouses,
  UserCreateSchema,
  UserUpdateSchema,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";
import { OrganizationLive, OrganizationService } from "./organizations";
import { WarehouseLive, WarehouseService } from "./warehouses";

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
            payment_method: true,
          },
        },
        orgs: {
          with: {
            org: {
              with: {
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
                        storages: {
                          with: {
                            storage: {
                              with: {
                                type: true,
                              },
                            },
                          },
                        },
                        addresses: {
                          with: {
                            address: true,
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
                storages: {
                  with: {
                    storage: {
                      with: {
                        type: true,
                      },
                    },
                  },
                },
                addresses: {
                  with: {
                    address: true,
                  },
                },
                areas: true,
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
                        storages: {
                          with: {
                            storage: {
                              with: {
                                type: true,
                              },
                            },
                          },
                        },
                        addresses: {
                          with: {
                            address: true,
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
                storages: {
                  with: {
                    storage: {
                      with: {
                        type: true,
                      },
                    },
                  },
                },
                addresses: {
                  with: {
                    address: true,
                  },
                },
                areas: true,
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
          return yield* Effect.fail(new Error("Password is required"));
        }
        uI = Object.assign(cleanedUserInput, {
          hashed_password: hashPassword(password),
        });

        const [x] = yield* Effect.promise(() => db.insert(TB_users).values(uI).returning());

        const user = yield* findById(x.id);
        if (!user) {
          return yield* Effect.fail(new Error("Failed to create user"));
        }

        return user;
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
            columns: {
              hashed_password: false,
            },
          }),
        );
        return user;
      });

    const findByEmail = (emailInput: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const emailX = pipe(string(), email());
        const parsedEmail = safeParse(emailX, emailInput);
        if (!parsedEmail.success) {
          return yield* Effect.fail(new Error("Invalid email format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (fields, operations) => operations.eq(fields.email, parsedEmail.output),
            with: rels,
            columns: {
              hashed_password: false,
            },
          }),
        );
      });

    const update = (id: string, userInput: InferInput<typeof UserUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [updatedUser] = yield* Effect.promise(() =>
          db
            .update(TB_users)
            .set({ ...userInput, updatedAt: new Date() })
            .where(eq(TB_users.id, parsedId.output))
            .returning(),
        );
        return updatedUser;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.delete(TB_users).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        return deletedUser;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [deletedUser] = yield* Effect.promise(() =>
          db.update(TB_users).set({ deletedAt: new Date() }).where(eq(TB_users.id, parsedId.output)).returning(),
        );
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
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        const [updatedUser] = yield* Effect.promise(() =>
          db.update(TB_users).set({ status: "disabled" }).where(eq(TB_users.id, parsedId.output)).returning(),
        );
        return updatedUser;
      });

    const verifyPassword = (emailInput: string, password: string) =>
      Effect.gen(function* (_) {
        const parsedEmail = safeParse(pipe(string(), email()), emailInput);
        if (!parsedEmail.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        // check if the user password matches
        const user = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) =>
              operations.and(
                operations.eq(users.email, parsedEmail.output),
                operations.eq(users.hashed_password, hashPassword(password)),
              ),
          }),
        );
        return typeof user !== "undefined";
      });

    const findLastOrganization = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        return yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (users_warehouses, operations) => operations.eq(users_warehouses.owner_id, parsedUserId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
          }),
        );
      });

    const findLastWarehouse = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }
        return yield* Effect.promise(() =>
          db.query.TB_warehouses.findFirst({
            where: (users_warehouses, operations) => operations.eq(users_warehouses.ownerId, parsedUserId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
          }),
        );
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
        yield* Effect.promise(() => db.insert(TB_organization_users).values(userOrgs).returning());

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
        yield* Effect.promise(() => db.insert(TB_users_warehouses).values(userWhs).returning());

        const orgWhs = parse(
          array(
            object({
              organizationId: prefixed_cuid2,
              warehouseId: prefixed_cuid2,
            }),
          ),
          org_wh,
        );
        yield* Effect.promise(() => db.insert(TB_organizations_warehouses).values(orgWhs).returning());
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
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive, OrganizationLive, WarehouseLive],
}) {}

export const UserLive = UserService.Default;
export type UserInfo = NonNullable<Effect.Effect.Success<ReturnType<UserService["findById"]>>>;
