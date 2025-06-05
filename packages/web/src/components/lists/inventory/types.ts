import { OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { Accessor } from "solid-js";

export type InventoryListProps = {
  inventory: Accessor<OrganizationInventoryInfo>;
};

export type FacilitySelect = {
  id: string;
  label: string;
  value: string;
};

export type WarehouseSelect = {
  id: string;
  label: string;
  value: string;
};

export type StorageType = OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]["storages"][0];
