import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { SessionCreateSchema, SessionUpdateSchema, TB_sessions } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
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
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/sessions/create")(function* (
      sessionInput: InferInput<typeof SessionCreateSchema>,
    ) {
      const [session] = yield* db.insert(TB_sessions).values(sessionInput).returning();
      if (!session) {
        return yield* Effect.fail(new SessionNotCreated({}));
      }
      return session;
    });

    const findById = Effect.fn("@warehouse/sessions/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SessionInvalidId({ id }));
      }

      const session = yield* db.query.TB_sessions.findFirst({
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
                  wh: {
                    with: {
                      products: {
                        with: {
                          product: true,
                        },
                      },
                    },
                  },
                  fc: true,
                },
              },
            },
          },
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
          wh: {
            with: {
              products: {
                with: {
                  product: true,
                },
              },
            },
          },
          fc: true,
        },
      });

      if (!session) {
        return yield* Effect.fail(new SessionNotFound({ id }));
      }

      return session;
    });

    const generateToken = Effect.fn("@warehouse/sessions/generateToken")(function* () {
      const token = randomBytes(32).toString("hex");
      return token;
    });

    const findByUserId = Effect.fn("@warehouse/sessions/findByUserId")(function* (userId: string) {
      const parsedId = safeParse(prefixed_cuid2, userId);
      if (!parsedId.success) {
        return yield* Effect.fail(new SessionInvalidId({ id: userId }));
      }

      return yield* db.query.TB_sessions.findMany({
        where: (sessions, operations) => operations.eq(sessions.userId, parsedId.output),
        with: {
          user: {
            columns: {
              hashed_password: false,
            },
          },
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
      });
    });

    const findByToken = Effect.fn("@warehouse/sessions/findByToken")(function* (token: string) {
      const session = yield* db.query.TB_sessions.findFirst({
        where: (sessions, operations) => operations.eq(sessions.access_token, token),
        with: {
          user: {
            columns: {
              hashed_password: false,
            },
          },
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
      });

      if (!session) {
        return yield* Effect.fail(new SessionTokenNotFound({ token }));
      }

      return session;
    });

    const remove = Effect.fn("@warehouse/sessions/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SessionInvalidId({ id }));
      }

      const [deletedSession] = yield* db.delete(TB_sessions).where(eq(TB_sessions.id, parsedId.output)).returning();

      if (!deletedSession) {
        return yield* Effect.fail(new SessionNotDeleted({ id }));
      }

      return deletedSession;
    });

    const removeByUserId = Effect.fn("@warehouse/sessions/removeByUserId")(function* (userId: string) {
      const parsedId = safeParse(prefixed_cuid2, userId);
      if (!parsedId.success) {
        return yield* Effect.fail(new SessionInvalidId({ id: userId }));
      }

      return yield* db.delete(TB_sessions).where(eq(TB_sessions.userId, parsedId.output)).returning();
    });

    const update = Effect.fn("@warehouse/sessions/update")(function* (input: InferInput<typeof SessionUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SessionInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_sessions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_sessions.id, parsedId.output))
        .returning();

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
