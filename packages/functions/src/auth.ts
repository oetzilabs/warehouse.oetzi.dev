import { issuer } from "@openauthjs/openauth";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { subjects } from "@warehouseoetzidev/core/src/auth/subjects";
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
  success: async (ctx, value) => {
    return new Response("Success");
  },
});

export const handler = handle(app);
