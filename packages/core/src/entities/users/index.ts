import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { email, InferInput, object, omit, pipe, safeParse, string } from "valibot";
import { TB_users, user_status_enun_values, UserCreateSchema, UserUpdateSchema } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
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
  UserNotFoundViaEmail,
  UserNotUpdated,
  UserPasswordRequired,
} from "./errors";

export const UserFindBySchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  verified: Schema.optional(Schema.Boolean),
  status: Schema.optional(Schema.Literal(...user_status_enun_values)),
});

export class UserService extends Effect.Service<UserService>()("@warehouse/users", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;
    const hashPassword = (password: string) => createHash("sha256").update(password).digest("hex");

    const create = Effect.fn("@warehouse/users/create")(function* (userInput: InferInput<typeof UserCreateSchema>) {
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

      const [user] = yield* db.insert(TB_users).values(uI).returning();
      if (!user) {
        return yield* Effect.fail(new UserNotCreated({}));
      }

      return user;
    });

    const findById = Effect.fn("@warehouse/users/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id }));
      }

      const user = yield* db.query.TB_users.findFirst({
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
              org: true,
            },
          },
          sessions: {
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
              },
              wh: true,
              fc: true,
              org: {
                with: {
                  products: {
                    with: {
                      product: {
                        with: {
                          labels: true,
                          brands: true,
                          suppliers: true,
                        },
                      },
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
              },
            },
          },
        },
        columns: {
          hashed_password: false,
        },
      });

      if (!user) {
        return yield* Effect.fail(new UserNotFound({ id }));
      }

      return user;
    });

    const findByEmail = Effect.fn("@warehouse/users/findByEmail")(function* (emailInput: string) {
      const emailX = pipe(string(), email());
      const parsedEmail = safeParse(emailX, emailInput);
      if (!parsedEmail.success) {
        return yield* Effect.fail(new UserInvalidEmail({ email: emailInput }));
      }

      const user = yield* db.query.TB_users.findFirst({
        where: (fields, operations) => operations.eq(fields.email, parsedEmail.output),
        columns: {
          hashed_password: false,
        },
      });

      if (!user) {
        return yield* Effect.fail(new UserNotFoundViaEmail({ email: emailInput }));
      }

      return user;
    });

    const findBy = Effect.fn("@warehouse/organizations/findBy")(function* (filter: typeof UserFindBySchema.Type) {
      return yield* db.query.TB_users.findMany({
        where: (fields, operations) => {
          const collector = [];
          if (filter.name) {
            collector.push(operations.ilike(fields.name, `%${filter.name}%`));
          }
          if (filter.email) {
            collector.push(operations.ilike(fields.email, `%${filter.email}%`));
          }
          if (filter.status) {
            collector.push(operations.eq(fields.status, filter.status));
          }
          if (filter.verified !== undefined) {
            if (filter.verified) {
              collector.push(operations.isNotNull(fields.verifiedAt));
            } else {
              collector.push(operations.isNull(fields.verifiedAt));
            }
          }
          return operations.or(...collector);
        },
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
              org: true,
            },
          },
          sessions: {
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
              },
              wh: true,
              fc: true,
              org: {
                with: {
                  products: {
                    with: {
                      product: {
                        with: {
                          labels: true,
                          brands: true,
                          suppliers: true,
                        },
                      },
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
              },
            },
          },
        },
        columns: {
          hashed_password: false,
        },
      });
    });

    const all = Effect.fn("@warehouse/users/all")(function* () {
      return yield* db.query.TB_users.findMany({
        columns: { hashed_password: false },
      });
    });

    const update = Effect.fn("@warehouse/users/update")(function* (
      id: string,
      userInput: InferInput<typeof UserUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id }));
      }
      let hashed_password: string | undefined;
      if (userInput.password) {
        hashed_password = hashPassword(userInput.password);
      }
      const [updatedUser] = yield* db
        .update(TB_users)
        .set({ ...userInput, updatedAt: new Date(), ...(hashed_password !== undefined ? { hashed_password } : {}) })
        .where(eq(TB_users.id, parsedId.output))
        .returning();
      if (!updatedUser) {
        return yield* Effect.fail(new UserNotUpdated({ id }));
      }
      return updatedUser;
    });

    const remove = Effect.fn("@warehouse/users/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id }));
      }
      const [deletedUser] = yield* db.delete(TB_users).where(eq(TB_users.id, parsedId.output)).returning();
      if (!deletedUser) {
        return yield* Effect.fail(new UserNotDeleted({ id }));
      }
      return deletedUser;
    });

    const safeRemove = Effect.fn("@warehouse/users/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id }));
      }
      const [deletedUser] = yield* db
        .update(TB_users)
        .set({ deletedAt: new Date() })
        .where(eq(TB_users.id, parsedId.output))
        .returning();
      if (!deletedUser) {
        return yield* Effect.fail(new UserNotDeleted({ id }));
      }
      return deletedUser;
    });

    const notify = Effect.fn("@warehouse/users/notify")(function* (message: string) {
      return message;
    });

    const disable = Effect.fn("@warehouse/users/disable")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id }));
      }
      const [updatedUser] = yield* db
        .update(TB_users)
        .set({ status: "disabled" })
        .where(eq(TB_users.id, parsedId.output))
        .returning();
      if (!updatedUser) {
        return yield* Effect.fail(new UserDisableFailed({ id }));
      }
      return updatedUser;
    });

    const verifyPassword = Effect.fn("@warehouse/users/vrifyPassword")(function* (
      emailInput: string,
      password: string,
    ) {
      const parsedEmail = safeParse(pipe(string(), email()), emailInput);
      if (!parsedEmail.success) {
        return yield* Effect.fail(new UserInvalidEmail({ email: emailInput }));
      }

      const user = yield* db.query.TB_users.findFirst({
        where: (users, operations) =>
          operations.and(
            operations.eq(users.email, parsedEmail.output),
            operations.eq(users.hashed_password, hashPassword(password)),
          ),
      });

      if (!user) {
        return yield* Effect.fail(new UserAuthenticationFailed({ email: emailInput }));
      }

      return true;
    });

    const findLastOrganization = Effect.fn("@warehouse/users/findLastOrganization")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new UserInvalidId({ id: userId }));
      }
      const org = yield* db.query.TB_organizations.findFirst({
        where: (users_warehouses, operations) => operations.eq(users_warehouses.owner_id, parsedUserId.output),
        orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
      });
      if (!org) {
        return yield* Effect.fail(new UserLastOrgNotFound({ userId }));
      }
      return org;
    });

    const findLastWarehouse = Effect.fn("@warehouse/users/findLastWarehouse")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new UserInvalidId({ id: userId }));
      }
      const warehouse = yield* db.query.TB_warehouses.findFirst({
        where: (users_warehouses, operations) => operations.eq(users_warehouses.ownerId, parsedUserId.output),
        orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
      });
      if (!warehouse) {
        return yield* Effect.fail(new UserLastWarehouseNotFound({ userId }));
      }
      return warehouse;
    });

    const findLastFacility = Effect.fn("@warehouse/users/findLastFacility")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new UserInvalidId({ id: userId }));
      }

      const facility = yield* db.query.TB_warehouse_facilities.findFirst({
        where: (fields, operations) => operations.eq(fields.ownerId, parsedUserId.output),
        orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
      });
      if (!facility) {
        return yield* Effect.fail(new UserLastFacilityNotFound({ userId }));
      }
      return facility;
    });

    return {
      all,
      create,
      disable,
      findById,
      findByEmail,
      findBy,
      update,
      remove,
      safeRemove,
      notify,
      verifyPassword,
      findLastOrganization,
      findLastWarehouse,
      findLastFacility,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const UserLive = UserService.Default;
export type UserInfo = NonNullable<Effect.Effect.Success<ReturnType<UserService["findById"]>>>;
