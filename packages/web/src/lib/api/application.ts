import { action, cache } from "@solidjs/router";
import { Organization } from "@warehouseoetzidev/core/src/entities/organizations";
import { Services } from "@warehouseoetzidev/core/src/entities/services";
import { Resource } from "sst";
import { getCookie, setCookie } from "vinxi/http";
import { filters, SearchFilter, SearchResult } from "./search";

export const getApplicationVersion = cache(async () => {
  "use server";
  // console.log(`[${process.env.NODE_ENV}] Application Version`, process.env.GIT_HASH);
  // get the first 10 characters of the hash
  return (process.env.GIT_HASH ?? "").slice(0, 10);
}, "application-version");

const applyFilter = <T extends SearchResult>(value: string, data: Array<T>, filter: SearchFilter) => {
  let result = filters[filter.type].fn(value, data);
  switch (filter.sort) {
    case "createdAt":
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "updatedAt":
      result = result.sort(
        (a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
      );
      break;
    default:
      break;
  }
  if (filter.order === "desc") {
    result = result.toReversed();
  }
  return result;
};

export const appSearch = cache(async (search: string, filter: SearchFilter) => {
  "use server";

  // await sleep(3000);

  const data: Array<SearchResult> = [];
  if (!search) {
    // get popular services
    const popularServices = await Services.popular();
    for (const s of popularServices) {
      data.push({
        type: "service",
        name: s.name,
        description: s.description,
        image: s.image,
        slug: s.slug,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        location: s.location,
        organization: s.organization,
      });
    }
    // get popular companies
    const popularCompanies = await Organization.popular();
    for (const c of popularCompanies) {
      data.push({
        type: "organization",
        id: c.id,
        name: c.name,
        description: c.description,
        image: c.image,
        slug: c.slug,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        location: c.location,
        services: c.services
          .map((ss) => ss.service)
          .map((s) => ({
            name: s.name,
            description: s.description,
            image: s.image,
            slug: s.slug,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            location: s.location,
          })),
        verified: c.verified ?? false,
        authorized: c.authorized ?? false,
      });
    }

    return applyFilter(search, data, filter);
  }

  const services = await Services.findManyByName(search);
  const companies = await Organization.findManyByName(search);

  for (const s of services) {
    data.push({
      name: s.name,
      type: "service",
      description: s.description,
      image: s.image,
      slug: s.slug,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      location: s.location,
      organization: s.organization,
    });
  }
  for (const c of companies) {
    data.push({
      type: "organization",
      id: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      slug: c.slug,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      location: c.location,
      services: c.services
        .map((ss) => ss.service)
        .map((s) => ({
          name: s.name,
          description: s.description,
          image: s.image,
          slug: s.slug,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          location: s.location,
        })),
      verified: c.verified ?? false,
      authorized: c.authorized ?? false,
    });
  }
  return applyFilter(search, data, filter);
}, "application-search");

export const getContactEmail = cache(async () => {
  "use server";
  return Resource.WithEmail;
}, "application-contact-email");

export const getBannerCookie = cache(async (key: string) => {
  "use server";
  // TODO: check if cookie is valid
  // cookie should be a boolean
  let cookie = getCookie(`northstar-banner-${key}`) ?? false;
  cookie = Boolean(cookie);
  return !cookie;
}, "northstar-banner");

export const setBannerCookie = action(async (key: string) => {
  "use server";

  setCookie(`northstar-banner-${key}`, Boolean(true).toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
  });
});
