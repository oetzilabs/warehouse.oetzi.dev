import { Organization } from "@zomoetzidev/core/src/entities/organizations";
import { StatusCodes } from "http-status-codes";
import { ApiHandler, error, getUser, json } from "./utils";

export const handler = ApiHandler(async (_event) => {
  const authtoken = _event.headers["Authorization"] || _event.headers["authorization"];
  if (!authtoken) {
    return error("No Authorization header", StatusCodes.UNAUTHORIZED);
  }
  const token = authtoken.split(" ")[1];
  const user = await getUser(token);

  if (!user) {
    return error("User not found", StatusCodes.NOT_FOUND);
  }

  const org = await Organization.lastCreatedByUser(user.id);

  return json({
    email: user.email,
    user_id: user.id,
    organization_id: org?.id ?? null,
  });
});
