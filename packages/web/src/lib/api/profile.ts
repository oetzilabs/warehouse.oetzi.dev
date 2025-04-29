import { action, cache, redirect } from "@solidjs/router";
import { User } from "@zomoetzidev/core/src/entities/users";
import { getEvent } from "vinxi/http";
import { withSession } from "./utils";

export const updateProfile = action(async (form: FormData) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }
  const data = Object.fromEntries(form.entries());
  const validation = User.safeParseUpdate({
    ...data,
    id: session.user.id,
  });
  if (!validation.success) {
    throw validation.error;
  }
  const x = await User.update(validation.data);
  if (!x) {
    throw new Error("Couldn't update user profile");
  }
  return redirect("/setup/organization");
});

export const getProfile = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }
  const u = await User.findById(session.user.id);
  return u;
}, "profile");
