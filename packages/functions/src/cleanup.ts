import { TransitPositions } from "@zomoetzidev/core/src/entities/positions";
import { RolesAndPermissions } from "@zomoetzidev/core/src/entities/roles_and_permissions";
import { ApiHandler, json } from "./utils";

export const transitposition = ApiHandler(async (_evt) => {
  const positions = await TransitPositions.deleteAll();
  return json(positions);
});

export const roles = ApiHandler(async (_evt) => {
  const roles = await RolesAndPermissions.deleteAll();
  return json(roles);
});
