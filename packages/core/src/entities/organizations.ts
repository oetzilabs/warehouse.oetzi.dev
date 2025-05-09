import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, string, type InferInput } from "valibot";
import organizations from "../data/organizations.json";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  OrganizationCreateSchema,
  OrganizationUpdateSchema,
  TB_organization_users,
  TB_organizations,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

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
                storages: {
                  with: {
                    storage: {
                      with: {
                        type: true,
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
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        // check if organization already exists with the same name
        const exists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.slug, generateSlug(userInput.name)),
          }),
        );

        if (exists) {
          return yield* Effect.fail(new Error("Organization already exists"));
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
          return yield* Effect.fail(new Error("Failed to add user to organization"));
        }
        return org;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.id, parsedId.output),
            with: relations,
          }),
        );
      });

    const findBySlug = (slug: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.slug, slug),
            with: relations,
          }),
        );
      });

    const update = (input: InferInput<typeof OrganizationUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning(),
        );
        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ deletedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }

        return yield* Effect.promise(() =>
          db
            .update(TB_organizations)
            .set({ deletedAt: new Date() })
            .where(eq(TB_organizations.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );
      });

    const addUser = (userId: string, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid user ID"));
        }

        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }

        const organizationExists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.id, parsedOrganizationId.output),
          }),
        );

        if (!organizationExists) {
          return yield* Effect.fail(new Error("Organization does not exist"));
        }

        const userExists = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, parsedUserId.output),
          }),
        );

        if (!userExists) {
          return yield* Effect.fail(new Error("User does not exist"));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_organization_users.findFirst({
            where: (organization_users, operations) =>
              and(
                operations.eq(organization_users.user_id, parsedUserId.output),
                operations.eq(organization_users.organization_id, parsedOrganizationId.output),
              ),
          }),
        );

        if (exists) {
          return yield* Effect.fail(new Error("User already exists in organization"));
        }

        const entries = yield* Effect.promise(() =>
          db
            .insert(TB_organization_users)
            .values({ user_id: parsedUserId.output, organization_id: parsedOrganizationId.output })
            .returning(),
        );

        if (entries.length === 0) {
          return yield* Effect.fail(new Error("Failed to add user to organization"));
        }

        return entries[0];
      });

    const removeUser = (organizationId: string, userId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid user ID"));
        }
        const organizationExists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.id, parsedOrganizationId.output),
          }),
        );
        if (!organizationExists) {
          return yield* Effect.fail(new Error("Organization does not exist"));
        }
        const userExists = yield* Effect.promise(() =>
          db.query.TB_users.findFirst({
            where: (users, operations) => operations.eq(users.id, parsedUserId.output),
          }),
        );
        if (!userExists) {
          return yield* Effect.fail(new Error("User does not exist"));
        }

        const removed_entries = yield* Effect.promise(() =>
          db
            .delete(TB_organization_users)
            .where(
              and(
                eq(TB_organization_users.user_id, parsedUserId.output),
                eq(TB_organization_users.organization_id, parsedOrganizationId.output),
              ),
            )
            .returning(),
        );

        if (removed_entries.length === 0) {
          return yield* Effect.fail(new Error("Failed to remove user to organization"));
        }

        return removed_entries[0];
      });

    const users = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
        }

        const organizationExists = yield* Effect.promise(() =>
          db.query.TB_organizations.findFirst({
            where: (organizations, operations) => operations.eq(organizations.id, parsedOrganizationId.output),
          }),
        );

        if (!organizationExists) {
          return yield* Effect.fail(new Error("Organization does not exist"));
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
          return yield* Effect.fail(new Error("Invalid user ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_organizations.findMany({
            where: (organizations, operations) => operations.eq(organizations.owner_id, parsedId.output),
            with: relations,
          }),
        );
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbOrgs = yield* Effect.promise(() => db.query.TB_organizations.findMany());

        const os = parse(
          array(
            object({
              ...OrganizationCreateSchema.entries,
              owner_id: prefixed_cuid2,
              id: prefixed_cuid2,
              name: string(),
              slug: string(),
            }),
          ),
          organizations,
        );

        const existing = dbOrgs.map((u) => u.id);

        const toCreate = os.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_organizations).values(toCreate).returning());
          yield* Effect.log("Created organizations", toCreate);
        }

        const toUpdate = os.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const organization of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_organizations)
                .set({ ...organization, updatedAt: new Date() })
                .where(eq(TB_organizations.id, organization.id))
                .returning(),
            );
          }
        }

        return os;
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
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrganizationLive = OrganizationService.Default;

// Type exports
export type OrganizationInfo = NonNullable<Awaited<ReturnType<OrganizationService["findById"]>>>;
