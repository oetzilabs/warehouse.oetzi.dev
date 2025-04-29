import { createClient } from "@openauthjs/openauth/client";
import { Resource } from "sst";

export const client = createClient({
  clientID: "nextjs",
  issuer: Resource.Auth.url,
});
