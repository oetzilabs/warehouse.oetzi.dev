import type { Services } from "@warehouseoetzidev/core/src/entities/services";

export const filters = {
  all: {
    label: "All",
    fn: (v: string, data: Array<SearchResult>) => data,
  },
  offers: {
    label: "Offers",
    fn: (v: string, data: Array<SearchResult>) =>
      data.filter((r) => r.type === "service" && r.name.toLowerCase().includes(v.toLowerCase())),
  },
  service: {
    label: "Services",
    fn: (v: string, data: Array<SearchResult>) =>
      data.filter((r) => r.type === "service" && r.name.toLowerCase().includes(v.toLowerCase())),
  },
  organization: {
    label: "Companies",
    fn: (v: string, data: Array<SearchResult>) =>
      data.filter((r) => r.type === "organization" && r.name.toLowerCase().includes(v.toLowerCase())),
  },
  location: {
    label: "Locations",
    fn: (v: string, data: Array<SearchResult>) =>
      data.filter((r) => (r.location ?? "").toLowerCase().includes(v.toLowerCase())),
  },
} as const;

export const popularities = {
  unset: {
    label: "Unset",
    fn: (data: Array<SearchResult>) => data,
  },
  popular: {
    label: "Popular",
    fn: (data: Array<SearchResult>) => data,
  },
  recommended: {
    label: "Recommended",
    fn: (data: Array<SearchResult>) => data,
  },
};

type CommonSearchResult = {
  name: string;
  description: string | null;
  image: string | null;
  location: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type SearchResult = CommonSearchResult &
  (
    | {
        type: "service";
        organization: Services.Frontend["organization"];
      }
    | {
        type: "organization";
        id: string;
        services: Array<CommonSearchResult>;
        verified: boolean;
        authorized: boolean;
      }
  );

export type SearchFilter = {
  type: keyof typeof filters;
  sort: "createdAt" | "updatedAt";
  order: "desc" | "asc";
  selection: "popular" | "recommended" | "unset";
};
