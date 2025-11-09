import { HttpApiBuilder } from "@effect/platform";
import { Layer } from "effect";
import { WarehouseApi } from "./api";
import { DevicesGroupLive } from "./groups/devices";
import { HomeGroupLive } from "./groups/home";
import { OrganizationsGroupLive } from "./groups/organizations";

export const WarehouseApiLive = HttpApiBuilder.api(WarehouseApi).pipe(
  Layer.provide([DevicesGroupLive, OrganizationsGroupLive, HomeGroupLive]),
);

export type {
  DeviceConfig,
  DeviceType,
  Organization,
  DeviceSetupRequest,
  DeviceConnectRequest,
  DeviceStatusResponse,
} from "./schemas";
