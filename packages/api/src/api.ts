import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform";
import { Schema } from "effect";
import {
  DeviceConfig,
  DeviceConnectRequest,
  DeviceSetupRequest,
  DeviceStatusResponse,
  DeviceType,
  Organization,
} from "./schemas";

// API Groups
const DeviceGroup = HttpApiGroup.make("devices")
  .add(
    HttpApiEndpoint.get("getTypes")`/types`
      .addSuccess(Schema.Array(DeviceType))
      .annotate(OpenApi.Summary, "Get available device types"),
  )
  .add(
    HttpApiEndpoint.post("setup")`/setup`
      .setPayload(DeviceSetupRequest)
      .addSuccess(DeviceConfig)
      .annotate(OpenApi.Summary, "Setup a new device"),
  )
  .add(
    HttpApiEndpoint.post("connect")`/connect`
      .setPayload(DeviceConnectRequest)
      .addSuccess(DeviceStatusResponse)
      .annotate(OpenApi.Summary, "Connect a device"),
  );

const OrganizationsGroup = HttpApiGroup.make("organizations").add(
  HttpApiEndpoint.get("list")`/list`
    .addSuccess(Schema.Array(Organization))
    .annotate(OpenApi.Summary, "List all organizations"),
);

const HomeGroup = HttpApiGroup.make("home").add(
  HttpApiEndpoint.get("index")`/`.addSuccess(Schema.String).annotate(OpenApi.Summary, "Home page"),
);

export class WarehouseApi extends HttpApi.make("warehouse-api")
  .annotate(OpenApi.Title, "Warehouse API")
  .annotate(OpenApi.Description, "Type-safe API for warehouse device management")
  .annotate(OpenApi.Version, "1.0.0")
  .add(HomeGroup.prefix("/"))
  .add(DeviceGroup.prefix("/device"))
  .add(OrganizationsGroup.prefix("/organizations")) {}
