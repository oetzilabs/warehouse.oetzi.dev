import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type SupplierInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type SuppliersListProps = {
  data: Accessor<SupplierInfo[]>;
};

export const SuppliersList = (props: SuppliersListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<SupplierInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : (props.data()[0]?.createdAt ?? new Date()),
      end: props.data().length === 0 ? new Date() : (props.data()[props.data().length - 1]?.createdAt ?? new Date()),
      preset: "clear",
    },
    search: { term: dsearch(), fields: ["name", "email", "phone"], fuseOptions: { keys: ["name", "email", "phone"] } },
    sort: {
      default: "name",
      current: "name",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
          field: "name",
          label: "Name",
          fn: (a, b) => a.name.localeCompare(b.name),
        },
      ],
    },
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

  const renderSupplierItem = (supplier: SupplierInfo) => (
    <>
      <div
        class={cn("flex flex-col w-full", {
          "opacity-70": supplier.deletedAt,
        })}
      >
        <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
          <div class="flex flex-row gap-4 items-center">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">{supplier.name}</span>
              <span class="text-xs text-muted-foreground">
                {dayjs(supplier.updatedAt ?? supplier.createdAt).format("MMM DD, YYYY - h:mm A")}
              </span>
            </div>
            <Show when={supplier.deletedAt}>
              <span class="text-xs text-red-500">Deleted</span>
            </Show>
          </div>
          <Button as={A} href={`./${supplier.id}`} size="sm" class="gap-2">
            Open
            <ArrowUpRight class="size-4" />
          </Button>
        </div>
        <div class="flex flex-col p-4 gap-2">
          <span class="text-xs text-muted-foreground">Email: {supplier.email}</span>
          <span class="text-xs text-muted-foreground">Phone: {supplier.phone}</span>
        </div>
      </div>
    </>
  );

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="sticky top-12 z-10 flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
            debouncedSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search suppliers" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderSupplierItem}
        emptyMessage="No suppliers have been added"
        noResultsMessage="No suppliers have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
};
