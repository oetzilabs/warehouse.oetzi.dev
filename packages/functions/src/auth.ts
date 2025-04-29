import { env } from "node:process";
import { Email } from "@zomoetzidev/core/src/email";
import { User } from "@zomoetzidev/core/src/entities/users";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { GoogleAdapter, LinkAdapter } from "sst/auth/adapter";
import { auth } from "sst/aws/auth";
import { sessions } from "./utils";

export const handler = auth.authorizer({
  session: sessions,
  providers: {
    google: GoogleAdapter({
      clientID: Resource.GoogleClientId.value,
      mode: "oidc",
    }),
    magicLink: LinkAdapter({
      onLink: async (link, claims) => {
        const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <link rel="preload" as="image" href="https://northstar.oetzi.dev/favicon.ico" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" /><!--$-->
  </head>
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Log in with this magic link<div></div>
  </div>

  <body style="background-color:#ffffff">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;padding-left:12px;padding-right:12px;margin:0 auto">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0">Login</h1><a href="${link}" style="color:#2754C5;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;display:block;margin-bottom:16px" target="_blank">Click here to log in with this magic link</a>
            <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-bottom:14px">Or, copy and paste this temporary login code:</p>
            <p style="font-size:14px;line-height:24px;margin:24px 0;color:#ababab;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-top:14px;margin-bottom:16px">If you didn&#x27;t try to login, you can safely ignore this email.</p>
            <p style="font-size:14px;line-height:24px;margin:24px 0;color:#ababab;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-top:12px;margin-bottom:38px">Hint: You can set a permanent password in Settings &amp; members → My account.</p><img alt="WareHouse&#x27;s Logo" height="32" src="https://northstar.oetzi.dev/favicon.ico" style="display:block;outline:none;border:none;text-decoration:none" width="32" />
            <p style="font-size:12px;line-height:22px;margin:16px 0;color:#898989;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-top:12px;margin-bottom:24px"><a href="https://northstar.oetzi.dev" style="color:#898989;text-decoration:underline;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px" target="_blank">WareHouse.</a>, simple and effective customs management for your teams.</p>
          </td>
        </tr>
      </tbody>
    </table><!--/$-->
  </body>

</html>`;

        await Email.send("info", claims.email, "Your Login Link is Here", html, link);

        return Response.redirect(env.AUTH_FRONTEND_URL + "/auth/email", 303);
      },
    }),
  },
  callbacks: {
    error: async (e, req) => {
      // get cookie `redirect_uri` from request
      const cookies = req.headers.get("Cookie")?.split(";") ?? [];
      const redirectUriCookie = cookies.find((c) => c.startsWith("redirect_uri="));
      const redirectUri = redirectUriCookie?.split("=")[1];
      console.log("redirectUri", redirectUri);
      // remove `/api/auth/callback` from redirectUri
      const redirectUriWithoutCallback = redirectUri?.replace("/api/auth/callback", "");
      console.log("redirectUriWithoutCallback", redirectUriWithoutCallback);

      const response = new Response(e.message, {
        status: StatusCodes.BAD_REQUEST,
        headers: {
          Location: redirectUriWithoutCallback + "/auth/error?error=unknown",
        },
      });
      return response;
    },
    auth: {
      async allowClient(clientID, redirect) {
        console.log(clientID, redirect);
        const clients = ["google", "magicLink"];
        if (!clients.includes(clientID)) {
          return false;
        }

        return true;
      },
      async error(error, request) {
        // get cookie `redirect_uri` from request
        const cookies = request.headers.get("Cookie")?.split(";") ?? [];
        const redirectUriCookie = cookies.find((c) => c.startsWith("redirect_uri="));
        const redirectUri = redirectUriCookie?.split("=")[1];
        console.log("redirectUri", redirectUri);
        // remove `/api/auth/callback` from redirectUri
        const redirectUriWithoutCallback = redirectUri?.replace("/api/auth/callback", "");
        console.log("redirectUriWithoutCallback", redirectUriWithoutCallback);

        console.log("auth-error", error);
        const response = new Response(error.message, {
          status: StatusCodes.BAD_REQUEST,
          headers: {
            Location: redirectUriWithoutCallback + "/auth/error?error=unknown",
          },
        });
        return response;
      },
      async success(response, input, request) {
        console.log(input.provider);
        const clients = ["google", "magicLink"];
        if (!clients.includes(input.provider)) {
          throw new Error("Unknown provider");
        }
        if (input.provider === "google") {
          const claims = input.tokenset.claims();
          const email = claims.email;
          const name = claims.preferred_username ?? claims.name;
          const image = claims.picture ?? "/assets/images/avatar.png";
          if (!email || !name) {
            console.error("No email or name found in tokenset", input.tokenset);
            return response.session({
              type: "public",
              properties: {},
            });
          }

          let user_ = await User.findByEmail(email);

          if (!user_) {
            user_ = await User.create({ email, name, image, type: "user" })!;
          }

          return response.session({
            type: "user",
            properties: {
              id: user_!.id,
              email: user_!.email,
            },
          });
        }
        if (input.provider === "magicLink") {
          const claims = input.claims;
          console.log("magiclink claims", claims);
          const email = claims.email;
          if (!email) {
            console.error("No email or name found in claims", claims);
            return response.session({
              type: "public",
              properties: {},
            });
          }
          let user_ = await User.findByEmail(email);
          if (!user_) {
            user_ = await User.create({ email, name: email, type: "user" })!;
          }
          return response.session({
            type: "user",
            properties: {
              id: user_!.id,
              email: user_!.email,
            },
          });
        }
        throw new Error("Unknown provider");
      },
    },
  },
});
