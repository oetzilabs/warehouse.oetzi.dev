import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type SupplierInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FilterPopover } from "./filter-popover";

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
    search: { term: dsearch() },
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
          <TextFieldInput placeholder="Search suppliers" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No suppliers have been added</span>
          </div>
        }
      >
        {(supplier) => (
          <A
            href={`./${supplier.id}`}
            class={cn(
              "flex flex-col gap-4 w-full h-content p-4 border rounded-lg shadow-sm transition-colors h-auto hover:bg-primary-foreground hover:border-primary/50 hover:shadow-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:border-primary/20 dark:hover:shadow-primary/10 dark:hover:text-foreground",
              {
                "opacity-70": supplier.deletedAt,
              },
            )}
          >
            <div class="flex flex-row items-center gap-4 justify-between w-full h-content">
              <div class="flex flex-row gap-4 items-center justify-start">
                <span class="text-sm font-medium leading-none">{supplier.name}</span>
                <Show when={supplier.deletedAt}>
                  <span class="text-xs text-red-500">Deleted</span>
                </Show>
              </div>
            </div>
            <div class="flex flex-col gap-2 w-full">
              <span class="text-xs text-muted-foreground">Email: {supplier.email}</span>
              <span class="text-xs text-muted-foreground">Phone: {supplier.phone}</span>
              <div class="flex w-full grow"></div>
              <span class="text-xs">
                {dayjs(supplier.updatedAt ?? supplier.createdAt).format("MMM DD, YYYY - h:mm A")}
              </span>
            </div>
          </A>
        )}
      </For>
    </div>
  );
};
