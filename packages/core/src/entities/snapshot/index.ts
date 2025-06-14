import { FileSystem, Path } from "@effect/platform";
import { createId } from "@paralleldrive/cuid2";
import dayjs from "dayjs";
import { Config, Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import {
  PreviousSnapshotNotFound,
  SnapshotInvalidType,
  SnapshotNotFound,
  SnapshotNotImplemented,
  SnapshotValidationFailed,
} from "./errors";
import { SnapshotInputSchema, type SnapshotDataInput, type SnapshotDataOutput } from "./schema";

export class SnapshotService extends Effect.Service<SnapshotService>()("@warehouse/snapshot", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    const SNAPSHOT_DIR = yield* Config.string("SNAPSHOT_DIR");
    const fs = yield* _(FileSystem.FileSystem);
    const path = yield* _(Path.Path);

    const listSnapshots = () =>
      Effect.gen(function* (_) {
        const files = yield* fs.readDirectory(path.join(SNAPSHOT_DIR));
        return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
      });

    const createSnapshot = (type: SnapshotDataInput["type"]) =>
      Effect.gen(function* (_) {
        let snap: SnapshotDataOutput;
        switch (type) {
          case "json":
            const products = yield* Effect.promise(() =>
              db.query.TB_products.findMany({
                with: {
                  labels: true,
                  brands: true,
                },
              }),
            ).pipe(
              Effect.map((products) =>
                products.map((p) => ({
                  ...p,
                  manufacturingDate: p.manufacturingDate ? dayjs(p.manufacturingDate).unix().toString() : "",
                  expirationDate: p.expirationDate ? dayjs(p.expirationDate).unix().toString() : "",
                  labels: p.labels.map((l) => l.labelId),
                  brands: p.brands?.id ?? null,
                })),
              ),
            );
            const labels = yield* Effect.promise(() => db.query.TB_product_labels.findMany());
            const payment_methods = yield* Effect.promise(() => db.query.TB_payment_methods.findMany());
            const warehouse_types = yield* Effect.promise(() => db.query.TB_warehouse_types.findMany());
            const document_storage_offers = yield* Effect.promise(() => db.query.TB_document_storage_offers.findMany());
            const storage_types = yield* Effect.promise(() => db.query.TB_storage_types.findMany());
            const brands = yield* Effect.promise(() => db.query.TB_brands.findMany());
            const suppliers = yield* Effect.promise(() =>
              db.query.TB_suppliers.findMany({
                with: {
                  products: {
                    with: {
                      product: true,
                    },
                  },
                },
              }),
            ).pipe(
              Effect.map((suppliers) =>
                suppliers.map((s) => ({
                  ...s,
                  products: s.products.map((p) => p.productId),
                })),
              ),
            );
            const sales = yield* Effect.promise(() =>
              db.query.TB_sales.findMany({
                with: {
                  items: true,
                  orders: true,
                },
              }),
            ).pipe(
              Effect.map((sales) =>
                sales.map((s) => ({
                  ...s,
                  items: s.items,
                  orders: s.orders.map((o) => o.id),
                })),
              ),
            );
            const customers = yield* Effect.promise(() =>
              db.query.TB_customers.findMany({
                with: {
                  sales: {
                    with: {
                      items: true,
                    },
                  },
                },
              }),
            ).pipe(
              Effect.map((customers) =>
                customers.map((c) => ({
                  ...c,
                  sales: c.sales.map((s) => s.id),
                })),
              ),
            );
            const users = yield* Effect.gen(function* (_) {
              const users = yield* Effect.promise(() =>
                db.query.TB_users.findMany({
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
                            devices: true,
                            sales: true,
                            products: {
                              with: {
                                product: true,
                              },
                            },
                            supps: true,
                            customers: true,
                            customerOrders: true,
                            purchases: true,
                            whs: {
                              with: {
                                warehouse: {
                                  with: {
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
                                    products: true,
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
              ).pipe(
                Effect.map((users) =>
                  users.map((user) => ({
                    ...user,
                    organizations: user.orgs.map((org) => ({
                      ...org.org,
                      products: org.org.products.map((prod) => prod.productId),
                      suppliers: org.org.supps.map((supp) => supp.supplier_id),
                      customers: org.org.customers.map((cust) => cust.customer_id),
                      warehouses: org.org.whs.map((wh) => ({
                        ...wh.warehouse,
                        products: wh.warehouse.products.map((prod) => prod.productId),
                        facilities: wh.warehouse.facilities,
                      })),
                      orders: {
                        customers: org.org.customerOrders,
                        suppliers: org.org.purchases,
                      },
                      devices: org.org.devices,
                      sales: org.org.sales.map((s) => s.saleId),
                    })),
                  })),
                ),
              );
              return users;
            });
            snap = {
              id: `snap_${createId()}`,
              createdAt: dayjs().unix().toString(),
              type,
              data: {
                // TODO!: Add missing data
                device_types: [],
                notifications: [],
                tax_rates: [],
                tax_groups: [],
                tax_group_countryrates: [],
                orders: [],
                sales,
                users, // Query users
                products,
                labels,
                payment_methods,
                warehouse_types,
                document_storage_offers,
                storage_types,
                brands,
                suppliers,
                customers,
              },
            } satisfies SnapshotDataOutput;
            break;
          case "sql":
            snap = {
              id: `snap_${createId()}`,
              createdAt: dayjs().unix().toString(),
              type,
              data: "",
            } satisfies SnapshotDataOutput;
            break;
          default:
            throw new Error("Invalid snapshot type");
            break;
        }

        return snap;
      });

    const getPreviousSnapshot = () =>
      Effect.gen(function* (_) {
        const list = yield* listSnapshots();
        const previous = list[list.length - 2];
        if (!previous) {
          return yield* Effect.fail(new PreviousSnapshotNotFound({ message: "No previous snapshot found" }));
        }
        return previous;
      });

    const getSnapshotById = (id: string) =>
      Effect.gen(function* (_) {
        const filename = path.join(SNAPSHOT_DIR, `${id}.json`);
        const file = yield* fs.exists(filename);
        if (!file) {
          return yield* Effect.fail(new SnapshotNotFound({ id }));
        }
        let parsed;
        try {
          const content = yield* fs.readFileString(filename);
          parsed = JSON.parse(content);
        } catch (e) {
          return yield* Effect.fail(
            new SnapshotValidationFailed({
              message: "Invalid snapshot format",
              errors: ["Parsing the snapshot failed"],
            }),
          );
        }

        const snapshot = yield* validateSnapshot(parsed);
        return snapshot;
      });

    const validateSnapshot = (data: unknown) =>
      Effect.gen(function* (_) {
        const parsed = safeParse(SnapshotInputSchema, data);
        if (!parsed.success) {
          return yield* Effect.fail(
            new SnapshotValidationFailed({
              message: "Invalid snapshot format",
              errors: parsed.issues.map((i) => i.message),
            }),
          );
        }
        return parsed.output;
      });

    const backup = (type: SnapshotDataInput["type"]) =>
      Effect.gen(function* (_) {
        const snapshot = yield* createSnapshot(type);
        // Ensure snapshots directory exists
        const folderExits = yield* fs.exists(path.join(SNAPSHOT_DIR));
        if (!folderExits) {
          yield* fs.makeDirectory(path.join(SNAPSHOT_DIR), { recursive: true });
        }
        const filename = path.join(SNAPSHOT_DIR, `${snapshot.id}.json`);
        yield* fs.writeFileString(filename, JSON.stringify(snapshot, null, 2));
        return snapshot;
      });

    const recover = (snapshotId: string) =>
      Effect.gen(function* (_) {
        const snap = yield* getSnapshotById(snapshotId);
        if (!snap) {
          return yield* Effect.fail(new SnapshotNotFound({ id: snapshotId }));
        }
        const type = snap.type;
        switch (type) {
          case "json":
            return yield* Effect.fail(new SnapshotNotImplemented({ id: snapshotId }));
          case "sql":
            return yield* Effect.fail(new SnapshotNotImplemented({ id: snapshotId }));
          default:
            return yield* Effect.fail(new SnapshotInvalidType({ id: snapshotId, type }));
        }
      });

    return {
      backup,
      recover,
      getSnapshotById,
      listSnapshots,
      validateSnapshot,
      getPreviousSnapshot,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SnapshotLive = SnapshotService.Default;

export type SnapshotInfo = NonNullable<Awaited<ReturnType<SnapshotService["getSnapshotById"]>>>;
