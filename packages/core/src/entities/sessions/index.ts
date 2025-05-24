import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { SessionCreateSchema, SessionUpdateSchema, TB_sessions } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  SessionInvalidId,
  SessionNotCreated,
  SessionNotDeleted,
  SessionNotFound,
  SessionNotUpdated,
  SessionTokenNotFound,
} from "./errors";

export class SessionService extends Effect.Service<SessionService>()("@warehouse/sessions", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_sessions.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        user: {
          columns: {
            hashed_password: false,
          },
          with: {
            sessions: {
              with: {
                org: {
                  with: {
                    suppliers: {
                      with: {
                        supplier: true,
                      },
                    },
                    customers: {
                      with: {
                        customer: true,
                      },
                    },
                    catalogs: true,
                    products: {
                      with: {
                        product: true,
                      },
                    },
                  },
                },
                wh: {
                  with: {
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
                  },
                },
                fc: {
                  with: {
                    devices: true,
                  },
                },
              },
            },
          },
        },
        org: {
          with: {
            catalogs: true,
            suppliers: {
              with: {
                supplier: true,
              },
            },
            customers: {
              with: {
                customer: true,
              },
            },
            products: {
              with: {
                product: true,
              },
            },
          },
        },
        wh: {
          with: {
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
          },
        },
        fc: {
          with: {
            devices: true,
          },
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (sessionInput: InferInput<typeof SessionCreateSchema>) =>
      Effect.gen(function* (_) {
        const [session] = yield* Effect.promise(() => db.insert(TB_sessions).values(sessionInput).returning());
        if (!session) {
          return yield* Effect.fail(new SessionNotCreated({}));
        }
        return session;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SessionInvalidId({ id }));
        }

        const session = yield* Effect.promise(() =>
          db.query.TB_sessions.findFirst({
            where: (sessions, operations) => operations.eq(sessions.id, parsedId.output),
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
                with: {
                  sessions: {
                    with: {
                      org: {
                        with: {
                          catalogs: true,
                          suppliers: {
                            with: {
                              supplier: true,
                            },
                          },
                          customers: {
                            with: {
                              customer: true,
                            },
                          },
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
                      wh: {
                        with: {
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
                        },
                      },
                      fc: {
                        with: {
                          devices: true,
                        },
                      },
                    },
                  },
                },
              },
              org: {
                with: {
                  catalogs: true,
                  suppliers: {
                    with: {
                      supplier: true,
                    },
                  },
                  customers: {
                    with: {
                      customer: true,
                    },
                  },
                  products: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
              wh: {
                with: {
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
                },
              },
              fc: {
                with: {
                  devices: true,
                },
              },
            },
          }),
        );

        if (!session) {
          return yield* Effect.fail(new SessionNotFound({ id }));
        }

        return session;
      });

    const generateToken = () =>
      Effect.gen(function* (_) {
        const token = randomBytes(32).toString("hex");
        return token;
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new SessionInvalidId({ id: userId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_sessions.findMany({
            where: (sessions, operations) => operations.eq(sessions.userId, parsedId.output),
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
                with: {
                  sessions: {
                    with: {
                      org: {
                        with: {
                          catalogs: true,
                          suppliers: {
                            with: {
                              supplier: true,
                            },
                          },
                          customers: {
                            with: {
                              customer: true,
                            },
                          },
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
                      wh: {
                        with: {
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
                        },
                      },
                      fc: {
                        with: {
                          devices: true,
                        },
                      },
                    },
                  },
                },
              },
              org: {
                with: {
                  catalogs: true,
                  suppliers: {
                    with: {
                      supplier: true,
                    },
                  },
                  customers: {
                    with: {
                      customer: true,
                    },
                  },
                  products: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
              wh: {
                with: {
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
                },
              },
              fc: {
                with: {
                  devices: true,
                },
              },
            },
          }),
        );
      });

    const findByToken = (token: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const session = yield* Effect.promise(() =>
          db.query.TB_sessions.findFirst({
            where: (sessions, operations) => operations.eq(sessions.access_token, token),
            with: {
              user: {
                columns: {
                  hashed_password: false,
                },
                with: {
                  sessions: {
                    with: {
                      org: {
                        with: {
                          catalogs: true,
                          suppliers: {
                            with: {
                              supplier: true,
                            },
                          },
                          customers: {
                            with: {
                              customer: true,
                            },
                          },
                          products: {
                            with: {
                              product: true,
                            },
                          },
                        },
                      },
                      wh: {
                        with: {
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
                        },
                      },
                      fc: {
                        with: {
                          devices: true,
                        },
                      },
                    },
                  },
                },
              },
              org: {
                with: {
                  catalogs: true,
                  suppliers: {
                    with: {
                      supplier: true,
                    },
                  },
                  customers: {
                    with: {
                      customer: true,
                    },
                  },
                  products: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
              wh: {
                with: {
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
                },
              },
              fc: {
                with: {
                  devices: true,
                },
              },
            },
          }),
        );

        if (!session) {
          return yield* Effect.fail(new SessionTokenNotFound({ token }));
        }

        return session;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SessionInvalidId({ id }));
        }

        const [deletedSession] = yield* Effect.promise(() =>
          db.delete(TB_sessions).where(eq(TB_sessions.id, parsedId.output)).returning(),
        );

        if (!deletedSession) {
          return yield* Effect.fail(new SessionNotDeleted({ id }));
        }

        return deletedSession;
      });

    const removeByUserId = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new SessionInvalidId({ id: userId }));
        }

        return yield* Effect.promise(() =>
          db.delete(TB_sessions).where(eq(TB_sessions.userId, parsedId.output)).returning(),
        );
      });

    const update = (input: InferInput<typeof SessionUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SessionInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_sessions)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_sessions.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new SessionNotUpdated({ id: input.id }));
        }

        return updated;
      });

    return {
      create,
      findById,
      findByUserId,
      findByToken,
      remove,
      removeByUserId,
      generateToken,
      update,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SessionLive = SessionService.Default;
export type SessionInfo = NonNullable<Effect.Effect.Success<ReturnType<SessionService["findById"]>>>;
