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
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import { type StorageInfo } from "@warehouseoetzidev/core/src/entities/storages";
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
        fn: (
          a: OrganizationInventoryInfo["warehouses"][number],
          b: OrganizationInventoryInfo["warehouses"][number],
        ) => {
          return a.warehouse.name.localeCompare(b.warehouse.name);
        },
      },
      {
        field: "capacity",
        label: "Total Capacity",
        fn: (
          a: OrganizationInventoryInfo["warehouses"][number],
          b: OrganizationInventoryInfo["warehouses"][number],
        ) => {
          const aCapacity = a.warehouse.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          const bCapacity = b.warehouse.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          return aCapacity - bCapacity;
        },
      },
    ],
  } as FilterConfig<OrganizationInventoryInfo["warehouses"][number]>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<OrganizationInventoryInfo["warehouses"][number]>>({
    disabled: () => props.inventory().warehouses.length === 0,
    dateRange: {
      start: new Date(),
      end: new Date(),
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["warehouse.name", "warehouse.description"],
      fuseOptions: { keys: ["warehouse.name", "warehouse.description"] },
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

  const calculateStorageCapacity = (storage: StorageInfo): number => {
    let capacity = storage.capacity || 0;
    if (storage.children && storage.children.length > 0) {
      capacity += storage.children.reduce((acc: number, child: any) => acc + calculateStorageCapacity(child), 0);
    }
    return capacity;
  };

  const calculateStorageOccupancy = (storage: StorageInfo): number => {
    let occupancy = storage.products?.length ?? 0;
    if (storage.children && storage.children.length > 0) {
      occupancy += (storage.children as StorageInfo[]).reduce((acc: number, child) => {
        if (!child) return acc;
        return acc + calculateStorageOccupancy(child as StorageInfo);
      }, 0);
    }
    return occupancy;
  };

  const calculateProductStock = (storage: StorageInfo, productId: string): number => {
    // Count occurrences in current storage
    const currentCount = storage.products?.filter((p) => p.product.id === productId).length ?? 0;

    // Add counts from children storages recursively
    const childrenCount =
      storage.children?.reduce((acc, child) => {
        return acc + calculateProductStock(child as StorageInfo, productId);
      }, 0) ?? 0;

    return currentCount + childrenCount;
  };

  const facilityAlerts = (
    facility: OrganizationInventoryInfo["warehouses"][number]["warehouse"]["facilities"][number],
  ) => {
    const lowStockProducts = new Map<
      string,
      {
        product: ProductInfo;
        count: number;
      }
    >();

    const processStorage = (storage: StorageInfo) => {
      // Process current storage's products
      storage.products?.forEach((p) => {
        const totalStock = calculateProductStock(storage, p.product.id);
        if (totalStock < p.product.minimumStock) {
          const existing = lowStockProducts.get(p.product.id);
          if (existing) {
            existing.count = totalStock; // Update with total stock count
          } else {
            lowStockProducts.set(p.product.id, { product: p.product, count: totalStock });
          }
        }
      });

      // Recursively process children
      storage.children?.forEach(processStorage);
    };

    // Process each storage in each area
    facility.areas.forEach((area) => {
      area.storages.forEach(processStorage);
    });

    return Array.from(lowStockProducts.values()).sort((a, b) => a.count - b.count);
  };

  const renderWarehouseCard = (warehouse: OrganizationInventoryInfo["warehouses"][number]) => {
    const totalCapacity =
      warehouse.warehouse.facilities?.reduce(
        (acc, f) =>
          acc +
          (f.areas?.reduce(
            (acc2, ar) =>
              acc2 + (ar.storages?.reduce((acc3, s) => acc3 + (s ? calculateStorageCapacity(s) : 0), 0) ?? 0),
            0,
          ) ?? 0),
        0,
      ) ?? 0;

    const currentOccupancy =
      warehouse.warehouse.facilities?.reduce(
        (acc, f) =>
          acc +
          (f.areas?.reduce(
            (acc2, ar) =>
              acc2 + (ar.storages?.reduce((acc3, s) => acc3 + (s ? calculateStorageOccupancy(s) : 0), 0) ?? 0),
            0,
          ) ?? 0),
        0,
      ) ?? 0;

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

    const renderProductStats = () => {
      const productStats = Array.from(props.inventory().stats.productCounts.values())
        .filter((product) => {
          // Filter products that are in this warehouse's storages
          return warehouse.warehouse.facilities.some((f) =>
            f.areas.some((a) => a.storages.some((s) => s.products.some((p) => p.product.id === product.id))),
          );
        })
        .map((product) => {
          // Calculate total stock for this product in this warehouse
          const totalStock = warehouse.warehouse.facilities.reduce(
            (warehouseAcc, f) =>
              warehouseAcc +
              f.areas.reduce(
                (facilityAcc, a) =>
                  facilityAcc + a.storages.reduce((areaAcc, s) => areaAcc + calculateProductStock(s, product.id), 0),
                0,
              ),
            0,
          );

          return {
            ...product,
            count: totalStock,
          };
        })
        .sort((a, b) => b.count - a.count);

      return (
        <div class="flex flex-col gap-2 p-4 border-t">
          <div class="flex flex-row items-center justify-between">
            <h5 class="text-sm font-medium">Product Inventory</h5>
            <Badge variant="outline">{productStats.length} products</Badge>
          </div>
          <div class="flex flex-col gap-2">
            <For each={productStats.slice(0, 5)}>
              {(product) => (
                <div class="flex flex-row items-center justify-between gap-2">
                  <span class="text-sm truncate">{product.name}</span>
                  <span class="text-sm font-['Geist_Mono_Variable'] tabular-nums">{product.count}</span>
                </div>
              )}
            </For>
            <Show when={productStats.length > 5}>
              <Button variant="ghost" size="sm" as={A} href={`/warehouse/${warehouse.warehouse.id}/inventory`}>
                Show all {productStats.length} products
              </Button>
            </Show>
          </div>
        </div>
      );
    };

    return (
      <div class="flex flex-col">
        <div class="flex justify-between items-center p-4 bg-muted-foreground/5 border-b">
          <h3 class="font-semibold">{warehouse.warehouse.name}</h3>
          <div class="flex flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              class="bg-background place-self-start"
              as={A}
              href={`/warehouse/${warehouse.warehouse.id}/facility/new`}
            >
              <Plus class="size-4" />
              Add Facility
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <For each={warehouse.warehouse.facilities}>
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
                      href={`/warehouse/${warehouse.warehouse.id}/facility/${facility.id}/inventory`}
                    >
                      Show Map
                      <ArrowUpRight class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="flex flex-col w-full aspect-video overflow-clip bg-muted-foreground/5 border-b">
                  <FacilityImage facility={() => facility} />
                </div>
                {renderProductStats()}
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
                                      {alert.count}/{alert.product.maximumStock ?? 0}
                                    </span>
                                  </div>
                                  <div class="w-full flex flex-col gap-2">
                                    <Progress
                                      value={alert.count}
                                      maxValue={alert.product.maximumStock ?? 0}
                                      color={progressColor(alert.count, alert.product.maximumStock ?? 0)}
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
