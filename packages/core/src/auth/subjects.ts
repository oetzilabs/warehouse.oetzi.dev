import { createSubjects } from "@openauthjs/openauth/subject";
import { nullable, object, string } from "valibot";

export const subjects = createSubjects({
  user: object({
    id: string(),
    org_id: nullable(string()),
    warehouse_id: nullable(string()),
  }),
});
