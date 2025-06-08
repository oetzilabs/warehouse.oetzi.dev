import FacilityImage from "@/components/FacilityImage";
import { FilterPopover } from "@/components/filters/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressValueLabel } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import { Warning } from "postcss";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import FacilityEditor from "../../FacilityEditor";
import { GenericList } from "../default";
import "@fontsource-variable/geist-mono";

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

    const facilityAlerts = (facility: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]) => {
      const lowStockProducts = new Map<
        string,
        {
          product: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][number]["storages"][number]["sections"][number]["spaces"][number]["products"][number];
          count: number;
        }
      >();

      facility.areas
        .flatMap((area) =>
          area.storages.flatMap((storage) =>
            storage.sections.flatMap((section) =>
              section.spaces.flatMap((space) => space.products.filter((product) => product.stock < product.minStock)),
            ),
          ),
        )
        .forEach((product) => {
          if (lowStockProducts.has(product.id)) {
            lowStockProducts.get(product.id)!.count++;
          } else {
            lowStockProducts.set(product.id, { product, count: 1 });
          }
        });

      return Array.from(lowStockProducts.values()).sort((a, b) => b.count - a.count);
    };

    const progressColor = (value: number, maxValue: number) => {
      const ratio = value / maxValue;
      const colors = [
        [0, 0, "bg-black dark:bg-white"],
        [0, 0.25, "bg-rose-400 dark:bg-rose-600"],
        [0.25, 0.5, "bg-orange-400 dark:bg-orange-600"],
        [0.5, 0.75, "bg-yellow-400 dark:bg-yellow-600"],
        [0.75, 1, "bg-lime-400 dark:bg-lime-600"],
        [1, Infinity, "bg-emerald-400 dark:bg-emerald-600"],
      ] as const;

      for (const [min, max, color] of colors) {
        if (ratio >= min && ratio <= max) {
          return color;
        }
      }
      return "bg-muted-foreground";
    };

    return (
      <div class="flex flex-col">
        <div class="flex justify-between items-center p-4 bg-muted-foreground/5 border-b">
          <h3 class="font-semibold">{warehouse.name}</h3>
          <div class="flex flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              class="bg-background place-self-start"
              as={A}
              href={`/warehouse/${warehouse.id}/facility/new`}
            >
              <Plus class="size-4" />
              Add Facility
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <For each={warehouse.facilities}>
            {(facility) => (
              <div class="border rounded-lg flex flex-col overflow-clip">
                <div class="flex flex-row items-center justify-between p-4 border-b gap-1">
                  <div class="flex flex-col gap-2">
                    <h4 class="font-medium">{facility.name}</h4>
                    <p class="text-sm text-muted-foreground">{facility.description}</p>
                  </div>
                  <div class="flex flewx-row gap-2 h-full">
                    <Button
                      size="sm"
                      variant="outline"
                      class="bg-background place-self-start"
                      as={A}
                      href={`/warehouse/${warehouse.id}/facility/${facility.id}/inventory`}
                    >
                      Show Map
                      <ArrowUpRight class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="flex flex-col w-full aspect-video overflow-clip bg-muted-foreground/5 border-b">
                  <FacilityImage facility={() => facility} />
                </div>
                <Show
                  when={facilityAlerts(facility).length > 0 && facilityAlerts(facility)}
                  fallback={<div class="w-full flex flex-col p-4"></div>}
                >
                  {(alerts) => (
                    <div class="flex flex-col gap-4">
                      <div class="flex flex-col">
                        <div class="flex flex-row gap-1 items-center justify-between text-sm border-b p-4">
                          <div class="flex flex-row items-center gap-2 text-red-500">
                            <TriangleAlert class="size-4" />
                            <span class="font-medium">Low Stock</span>
                          </div>
                        </div>
                        <div class="w-full flex flex-col">
                          <div class="flex flex-col w-full">
                            <For each={alerts().slice(0, 3)}>
                              {(alert) => (
                                <A
                                  href={`/products/${alert.product.id}`}
                                  class="flex flex-col gap-4 items-center justify-between text-sm p-4 hover:bg-muted-foreground/5 border-b last:border-b-0"
                                >
                                  <div class="flex flex-row gap-2 items-center w-full">
                                    <Package class="!size-4 shrink-0" />
                                    <span class="truncate w-full">{alert.product.name}</span>
                                    <span class="font-['Geist_Mono_Variable'] w-min">
                                      {alert.count}/{alert.product.maxStock ?? 0}
                                    </span>
                                  </div>
                                  <div class="w-full flex flex-col gap-2">
                                    <Progress
                                      value={alert.count}
                                      maxValue={alert.product.maxStock ?? 0}
                                      color={progressColor(alert.count, alert.product.maxStock ?? 0)}
                                    />
                                  </div>
                                </A>
                              )}
                            </For>
                            <Show when={alerts().length > 3}>
                              <div class="flex flex-col gap-4 items-center justify-between text-sm p-4 hover:bg-muted-foreground/5 border-b last:border-b-0">
                                <div class="flex flex-row gap-2 items-center w-full">
                                  <Package class="!size-4 shrink-0" />
                                  <span class="truncate w-full">
                                    {alerts().length - 3} more products with low stock
                                  </span>
                                </div>
                              </div>
                            </Show>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
              </div>
            )}
          </For>
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
