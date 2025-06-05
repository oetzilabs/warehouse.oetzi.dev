import { FilterPopover } from "@/components/filters/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type InventoryListProps = {
  inventory: Accessor<OrganizationInventoryInfo>;
};

export const InventoryList = (props: InventoryListProps) => {
  const [search, setSearch] = createSignal("");
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

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

  const filteredData = useFilter(() => props.inventory().warehouses, filterConfig);

  const renderWarehouseCard = (warehouse: OrganizationInventoryInfo["warehouses"][0]) => {
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
      <div class="flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="font-semibold">{warehouse.name}</h3>
          <Badge variant="outline">{warehouse.facilities.length} Facilities</Badge>
        </div>
        <div class="">
          <div class="">
            <For each={warehouse.facilities}>
              {(facility) => (
                <div class="p-4 border-b border-dashed last:border-b-0">
                  <div class="">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium">{facility.name}</h4>
                        <p class="text-sm text-muted-foreground">{facility.description}</p>
                      </div>
                    </div>

                    <div class="divide-y">
                      <For each={facility.areas}>
                        {(area) => (
                          <div class="py-3">
                            <div class="flex items-center justify-between mb-2">
                              <div>
                                <h5 class="font-medium">{area.name}</h5>
                                <p class="text-sm text-muted-foreground">{area.description}</p>
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              <For each={area.storages}>
                                {(storage) => {
                                  const occupancyPercentage =
                                    ((storage.currentOccupancy || 0) / storage.capacity) * 100;
                                  return (
                                    <div class="border rounded p-2 space-y-2">
                                      <div class="flex justify-between items-center">
                                        <span class="text-sm font-medium">{storage.name}</span>
                                        <Badge variant="secondary">{storage.type.name}</Badge>
                                      </div>
                                      <div class="space-y-1">
                                        <div class="text-xs flex justify-between">
                                          <span>Occupancy</span>
                                          <span>
                                            {storage.currentOccupancy}/{storage.capacity}
                                          </span>
                                        </div>
                                        <Progress value={occupancyPercentage} class="h-1" />
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
            debouncedSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search warehouses" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={() => props.inventory().warehouses} />
        </div>
      </div>

      <GenericList
        data={() => props.inventory().warehouses}
        filteredData={filteredData}
        renderItem={renderWarehouseCard}
        emptyMessage="No warehouses have been added"
        noResultsMessage="No warehouses have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
};
