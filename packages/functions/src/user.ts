import { StatusCodes } from "http-status-codes";
import { ApiHandler, error, getUser, json } from "./utils";
import { User } from "@zomoetzidev/core/src/entities/users";
import { Organization } from "@zomoetzidev/core/src/entities/organizations";

export const get = ApiHandler(async (_event) => {
  const token = _event.headers.authorization || _event.headers.Authorization;
  if (!token) {
    return error("Missing authorization header", StatusCodes.UNAUTHORIZED);
  }
  const user = await getUser(token);
  if (!user) {
    return error("User not found", StatusCodes.NOT_FOUND);
  }
  return json(user);
});

export const session = ApiHandler(async (_event) => {
  const token = _event.headers.authorization || _event.headers.Authorization;
  if (!token) {
    return error("Missing authorization header", StatusCodes.UNAUTHORIZED);
  }
  const user = await getUser(token);
  if (!user) {
    return error("User not found", StatusCodes.NOT_FOUND);
  }

  let organization = await Organization.lastCreatedByUser(user.id);

  // if (!organization) {
  //   organization = await Organization.create({ name: "default" }, user.id);
  //   await Organization.connectUser(organization.id, user.id);
  // }

  return json({
    email: user.email,
    user_id: user.id,
    organization_id: organization?.id ?? null,
    slug: organization?.slug ?? null,
  });
});

export const all = ApiHandler(async (_event) => {
  const users = await User.all();
  return json(users);
});
