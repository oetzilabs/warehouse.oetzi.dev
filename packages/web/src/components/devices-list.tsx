import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { DeviceInfo } from "@warehouseoetzidev/core/src/entities/devices";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FilterPopover } from "./filter-popover";
import { Button } from "./ui/button";
import { TextField, TextFieldInput } from "./ui/text-field";

type DevicesListProps = {
  data: Accessor<DeviceInfo[]>;
};

export function DevicesList(props: DevicesListProps) {
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
        fn: (a: DeviceInfo, b: DeviceInfo) => dayjs(a.createdAt).diff(dayjs(b.createdAt)),
      },
      {
        field: "name",
        label: "Name",
        fn: (a: DeviceInfo, b: DeviceInfo) => a.name.localeCompare(b.name),
      },
    ],
  } as FilterConfig<DeviceInfo>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<DeviceInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: defaultSort,
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
          <TextFieldInput placeholder="Search devices" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">
              <Show when={props.data().length === 0}>No devices have been added</Show>
              <Show when={props.data().length > 0 && filterConfig.search.term.length > 0}>
                No devices found matching your search
              </Show>
            </span>
          </div>
        }
      >
        {(device) => (
          <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
            <div class="flex flex-row items-center justify-between p-4">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{device.name}</span>
                <span class="text-xs text-muted-foreground">Type: {device.type.name}</span>
                <span class="text-xs text-muted-foreground">
                  Added: {dayjs(device.createdAt).format("MMM DD, YYYY")}
                </span>
              </div>
              <Button as={A} href={`/devices/${device.id}`} size="sm" class="gap-2">
                Open
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
