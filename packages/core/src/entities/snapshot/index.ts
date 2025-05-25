import { FileSystem, Path } from "@effect/platform";
import { createId } from "@paralleldrive/cuid2";
import dayjs from "dayjs";
import { Config, Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
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

    const createSnapshot = (type: SnapshotDataInput["type"]) =>
      Effect.gen(function* (_) {
        let snap: SnapshotDataOutput;
        switch (type) {
          case "json":
            snap = {
              id: `snap_${createId()}`,
              createdAt: dayjs().unix().toString(),
              type,
              data: {
                users: [], // Query users
                products: [], // Query products
                labels: [], // Query labels
                payment_methods: [], // Query payment methods
                warehouse_types: [], // Query warehouse types
                document_storage_offers: [], // Query document storage offers
                storage_types: [], // Query storage types
                brands: [], // Query brands
                suppliers: [], // Query suppliers
                customers: [], // Query customers
              },
            };
            break;
          case "sql":
            snap = {
              id: `snap_${createId()}`,
              createdAt: dayjs().unix().toString(),
              type,
              data: "",
            };
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
        const content = yield* fs.readFileString(filename);
        const data = JSON.parse(content);
        const snapshot = yield* validateSnapshot(data);
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

    const listSnapshots = () =>
      Effect.gen(function* (_) {
        const files = yield* fs.readDirectory(path.join(SNAPSHOT_DIR));
        return files;
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
