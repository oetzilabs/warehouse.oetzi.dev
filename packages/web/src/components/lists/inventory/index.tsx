import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { createEffect, createSignal, For, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { FacilityMap } from "./map";
import { InventoryListProps } from "./types";

export const InventoryList = (props: InventoryListProps) => {
  const [selectedFacilityId, setSelectedFacilityId] = createSignal<string | undefined>();
  const [selectedWarehouseId, setSelectedWarehouseId] = createSignal<string | undefined>();
  const [dsearch, setDSearch] = createSignal("");

  const defaultSort = {
    default: "name",
    current: "name",
    direction: "desc" as const,
    variants: [
      {
        field: "name",
        label: "Name",
        fn: (a: OrganizationInventoryInfo["warehouses"][0], b: OrganizationInventoryInfo["warehouses"][0]) => {
          return a.name.localeCompare(b.name);
        },
      },
      {
        field: "capacity",
        label: "Total Capacity",
        fn: (a: OrganizationInventoryInfo["warehouses"][0], b: OrganizationInventoryInfo["warehouses"][0]) => {
          const aCapacity = a.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          const bCapacity = b.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          return aCapacity - bCapacity;
        },
      },
    ],
  } as FilterConfig<OrganizationInventoryInfo["warehouses"][0]>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<OrganizationInventoryInfo["warehouses"][0]>>({
    disabled: () => props.inventory().warehouses.length === 0,
    dateRange: {
      start: new Date(),
      end: new Date(),
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name", "description"],
      fuseOptions: { keys: ["name", "description"] },
    },
    sort: defaultSort,
    filter: {
      default: null,
      current: null,
      variants: [],
    },
  });

  const filteredData = useFilter(() => props.inventory().warehouses, filterConfig);

  const renderWarehouseCard = (warehouse: OrganizationInventoryInfo["warehouses"][0]) => {
    const isSelected = () => selectedWarehouseId() === warehouse.id;
    const totalCapacity = warehouse.facilities.reduce(
      (acc, f) => acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
      0,
    );
    const currentOccupancy = warehouse.facilities.reduce(
      (acc, f) =>
        acc +
        f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + (s.currentOccupancy || 0), 0), 0),
      0,
    );
    const occupancyPercentage = (currentOccupancy / totalCapacity) * 100;

    return (
      <Card
        class={cn("p-4 cursor-pointer transition-colors hover:bg-muted/50", isSelected() && "ring-1 ring-primary")}
        onClick={() => handleWarehouseSelect(warehouse.id)}
      >
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">{warehouse.name}</h3>
            <Badge variant="outline">{warehouse.facilities.length} Facilities</Badge>
          </div>
          <p class="text-sm text-muted-foreground">{warehouse.description}</p>
          <div class="space-y-1">
            <div class="text-sm flex justify-between">
              <span>Occupancy</span>
              <span>
                {currentOccupancy}/{totalCapacity}
              </span>
            </div>
            <Progress value={occupancyPercentage} class="h-2" />
          </div>
        </div>
      </Card>
    );
  };

  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    const warehouse = props.inventory().warehouses.find((w) => w.id === warehouseId);
    if (warehouse!.facilities.length > 0) {
      setSelectedFacilityId(warehouse!.facilities[0].id);
    }
  };

  createEffect(() => {
    const escapeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedWarehouseId(undefined);
        setSelectedFacilityId(undefined);
      }
    };
    document.addEventListener("keydown", escapeKeyHandler);
    onCleanup(() => document.removeEventListener("keydown", escapeKeyHandler));
  });

  return (
    <div class="w-full flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <For each={filteredData()}>{renderWarehouseCard}</For>
      </div>

      <FacilityMap
        inventory={props.inventory}
        selectedWarehouseId={selectedWarehouseId}
        selectedFacilityId={selectedFacilityId}
        onWarehouseChange={setSelectedWarehouseId}
        onFacilityChange={setSelectedFacilityId}
      />
    </div>
  );
};
