import { action, cache, redirect } from "@solidjs/router";
import { Organization } from "@warehouseoetzidev/core/src/entities/organizations";
import { StatusCodes } from "http-status-codes";
import { withSession } from "./utils";

export const getUserOrganizations = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const orgs = await Organization.findManyByUserId(session.user.id);

  return orgs;
}, "user-organizations");

export const getOrganization = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.current_organization_id) {
    throw redirect("/setup/organization");
  }

  const organizations = await Organization.findById(session.session.current_organization_id);

  return organizations;
}, "organization");

export const getAllOrganizations = cache(async () => {
  "use server";
  const orgs = await Organization.all();
  return orgs;
}, "all-organizations");

export const getOrganizationBySlug = cache(async (slug: string) => {
  "use server";

  if (!slug) {
    return undefined;
  }

  const org = await Organization.findBySlug(slug);

  if (!org) {
    return redirect("/404?error=organization_not_found", { status: 404, statusText: "Organization not found" });
  }

  return org;
}, "organization-by-slug");

export const sendMessageToCompany = action(async (organizationId: string, message: string) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new Error("Organization does not exist");
  }

  const result = await Organization.sendMessageToCompany(org.id, session.user.id, session.user.email, message);

  return result;
});
