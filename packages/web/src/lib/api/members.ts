import { cache, redirect } from "@solidjs/router";
import { User } from "@zomoetzidev/core/src/entities/users";
import { withSession } from "./utils";

export const getAllMembers = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const members = await User.all();

  return members;
}, "all-members");
