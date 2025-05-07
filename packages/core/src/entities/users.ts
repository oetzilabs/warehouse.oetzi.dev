import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { email, InferInput, object, omit, pipe, safeParse, string } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { TB_users, UserCreateSchema, UserUpdateSchema } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class UserService extends Effect.Service<UserService>()("@warehouse/users", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    const hashPassword = (password: string) => createHash("sha256").update(password).digest("hex");
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_users.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
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
            org: true,
            wh: true,
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

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, parsedId.output),
            with: relations,
            columns: {
              hashed_password: false,
            },
          }),
        );
      });

    const findByEmail = (emailInput: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const emailX = pipe(string(), email());
        const parsedEmail = safeParse(emailX, emailInput);
        if (!parsedEmail.success) {
          return yield* Effect.fail(new Error("Invalid email format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.email, parsedEmail.output),
            with: relations,
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
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const UserLive = UserService.Default;
export type UserInfo = NonNullable<Effect.Effect.Success<ReturnType<UserService["findById"]>>>;
