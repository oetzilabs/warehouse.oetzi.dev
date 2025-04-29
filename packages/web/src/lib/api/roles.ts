import { action, cache, redirect } from "@solidjs/router";
import { RolesAndPermissions } from "@zomoetzidev/core/src/entities/roles_and_permissions";
import { withSession } from "./utils";

export const getAllRoles = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const roles = await RolesAndPermissions.all();

  return roles;
}, "all-roles");

export const getPermissionsByRoleId = cache(async (id: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const role = await RolesAndPermissions.findById(id);

  return role?.permissions.map((p) => p.permission);
}, "permissions-by-role-id");

export const addRoleToSystem = action(async (data: { name: string; description: string }) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const role = await RolesAndPermissions.create(data);

  if (!role) {
    throw new Error("Couldn't create role");
  }

  return role;
});
