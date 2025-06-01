import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { DeviceInfo } from "@warehouseoetzidev/core/src/entities/devices";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

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

  // Create a Map to store unique device types
  const uniqueTypesMap = new Map<string, DeviceInfo["type"]>();
  props.data().forEach((di) => {
    if (!uniqueTypesMap.has(di.type.id)) {
      uniqueTypesMap.set(di.type.id, di.type);
    }
  });

  // Convert the unique types from the Map into the desired format
  const uniqueTypeVariants = Array.from(uniqueTypesMap.values()).map((t) => ({
    type: `device_type:${t.code}`,
    label: t.name,
    // This fn still checks against the original data, which seems to be your intention
    fn: (item: DeviceInfo) => t.id === item.type.id,
  }));

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<DeviceInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name", "description"],
      fuseOptions: { keys: ["name", "type.name", "description"] },
    },
    sort: defaultSort,
    filter: {
      default: null,
      current: null,
      variants: uniqueTypeVariants,
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

  const renderDeviceItem = (device: DeviceInfo) => (
    <div class="flex flex-col w-full h-content">
      <div class="flex flex-row items-center justify-between p-4 border-b  bg-muted/30">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{device.name}</span>
        </div>
        <Button as={A} href={`/devices/${device.id}`} size="sm" class="gap-2">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>
      <div class="flex flex-col gap-1 w-full h-full p-4">
        <span class="text-xs text-muted-foreground">Type: {device.type.name}</span>
        <span class="text-xs text-muted-foreground">Added: {dayjs(device.createdAt).format("MMM DD, YYYY")}</span>
        <span class="text-xs text-muted-foreground">Last Location: </span>
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
          <TextFieldInput placeholder="Search devices" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderDeviceItem}
        emptyMessage="No devices have been added"
        noResultsMessage="No devices have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
}
