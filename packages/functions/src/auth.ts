import { issuer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Effect } from "effect";
import { handle } from "hono/aws-lambda";

const app = issuer({
  subjects,
  providers: {
    password: PasswordProvider(
      PasswordUI({
        copy: {
          error_email_taken: "This email is already taken.",
        },
        sendCode: async (email, code) => {
          console.log("sendCode", email, code);
        },
      }),
    ),
  },
  allow: async (input, req) => {
    return ["solidstart"].includes(input.clientID);
  },
  success: async (ctx, value) => {
    const user = await Effect.runPromise(
      Effect.gen(function* (_) {
        const service = yield* _(UserService);
        const u = yield* service.findByEmail(value.email);
        if (!u) {
          return yield* service.create({
            email: value.email,
            name: "",
            currentOrganizationId: null,
            currentWarehouseId: null,
          });
        }
        return u;
      }).pipe(Effect.provide(UserLive)),
    );

    return ctx.subject("user", {
      id: user.id,
      org_id: user.currentOrganizationId,
      warehouse_id: user.currentWarehouseId,
    });
  },
});

export const handler = handle(app);
