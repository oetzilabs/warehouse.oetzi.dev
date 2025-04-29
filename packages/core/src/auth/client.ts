import { createClient, type VerifyError } from "@openauthjs/openauth/client";
import { Resource } from "sst";

export const client = (id: string) => createClient({
  clientID: id,
  issuer: Resource.Auth.url,
});

export type Subjects = Exclude<Awaited<ReturnType<ReturnType<typeof client>["verify"]>>, VerifyError>;
