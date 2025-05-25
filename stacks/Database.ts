import { allSecrets, secret } from "./Secrets";

export const migrate = new sst.x.DevCommand("DatabaseMigrate", {
  dev: {
    command: "bun run drizzle-kit migrate",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const generate = new sst.x.DevCommand("DatabaseGenerate", {
  dev: {
    command: "bun run drizzle-kit generate",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const studio = new sst.x.DevCommand("DatabaseStudio", {
  dev: {
    command: "bun run drizzle-kit studio",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

// export const snapshotBackup = new sst.x.DevCommand("DatabaseSnapshotBackup", {
//   dev: {
//     command: "bun run ./src/snapshot.ts backup",
//     directory: "packages/core",
//     autostart: false,
//   },
//   link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
//   environment: {
//     SNAPSHOT_DIR: "./snapshots",
//   },
// });

// export const snapshotRecover = new sst.x.DevCommand("DatabaseSnapshotRecover", {
//   dev: {
//     command: "bun run ./src/snapshot-recover.ts recover",
//     directory: "packages/core",
//     autostart: false,
//   },
//   link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
//   environment: {
//     SNAPSHOT_DIR: "./snapshots",
//   },
// });

export const seed = new sst.x.DevCommand("DatabaseSeed", {
  dev: {
    command: "bun run ./src/seed.ts",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const drizzleKitUp = new sst.x.DevCommand("DatabaseDrizzleKitUp", {
  dev: {
    command: "bun run drizzle-kit up",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});
