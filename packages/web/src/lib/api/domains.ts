import { action, cache, redirect } from "@solidjs/router";
import { withSession } from "./utils";
import { Domains as DomainsCore } from "@zomoetzidev/core/src/entities/domains";
import { DomainCreateSchema } from "@zomoetzidev/core/src/drizzle/sql/schema";
import { z } from "zod";

export * as Domains from "./domains";

export const getDomains = cache(async () => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const domains = await DomainsCore.all();

  return domains;
}, "domains");

export const addDomain = action(async (data: z.infer<typeof DomainCreateSchema>) => {
  "use server";
  const [session] = await withSession();
  if (!session) {
    return redirect("/auth/login");
  }

  const exists = await DomainsCore.findByDomain(data.name);
  if (exists) {
    throw new Error("Domain already exists");
  }

  const domain = await DomainsCore.create(data);

  return domain;
});
