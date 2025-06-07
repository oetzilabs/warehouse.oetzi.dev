import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { WarehouseInfo } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type WarehouseListProps = {
  data: Accessor<WarehouseInfo[]>;
};

export function WarehouseList(props: WarehouseListProps) {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const defaultSort = {
    default: "date",
    current: "date",
    direction: "desc" as const,
    variants: [
      {
        field: "date",
        label: "Date",
        fn: (a: WarehouseInfo, b: WarehouseInfo) => dayjs(a.createdAt).diff(dayjs(b.createdAt)),
      },
      {
        field: "name",
        label: "Name",
        fn: (a: WarehouseInfo, b: WarehouseInfo) => a.name.localeCompare(b.name),
      },
    ],
  } as FilterConfig<WarehouseInfo>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<WarehouseInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name"],
      fuseOptions: { keys: ["name"] },
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

  const filteredData = useFilter(props.data, filterConfig);

  const renderWarehouseItem = (warehouse: WarehouseInfo) => (
    <div class="flex flex-col w-full h-content">
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{warehouse.name}</span>
        </div>
        <Button as={A} href={`/warehouse/${warehouse.id}`} size="sm" class="gap-2">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>
      <div class="flex flex-col gap-1 w-full h-full p-4">
        <span class="text-xs text-muted-foreground">Added: {dayjs(warehouse.createdAt).format("MMM DD, YYYY")}</span>
      </div>
    </div>
  );

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
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderWarehouseItem}
        emptyMessage="No warehouses have been added"
        noResultsMessage="No warehouses have been found"
        searchTerm={() => filterConfig.search.term}
        variant="grid"
      />
    </div>
  );
}
