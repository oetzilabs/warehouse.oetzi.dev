import { cf, domain } from "./Domain";

export const mainEmail = new sst.aws.Email("MainEmail", {
  sender: domain,
  dns: cf,
});
