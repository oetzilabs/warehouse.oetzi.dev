import { luciaAdapter } from "@warehouseoetzidev/core/src/drizzle/sql";
import type { SessionSelect, UserSelect } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { Lucia, TimeSpan } from "lucia";

export const lucia = new Lucia(luciaAdapter, {
  sessionExpiresIn: new TimeSpan(2, "w"),
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: import.meta.env.PROD,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.name,
      email: attributes.email,
    };
  },
  getSessionAttributes(databaseSessionAttributes) {
    return {
      access_token: databaseSessionAttributes.access_token,
      current_organization_id: databaseSessionAttributes.current_organization_id,
      createdAt: databaseSessionAttributes.createdAt,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: DatabaseSessionAttributes;
  }
}

type DatabaseUserAttributes = Omit<UserSelect, "id">;
type DatabaseSessionAttributes = Omit<SessionSelect, "id" | "expiresAt" | "updatedAt">;
