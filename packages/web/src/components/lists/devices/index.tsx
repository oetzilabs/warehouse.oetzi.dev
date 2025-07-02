import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { DeviceInfo } from "@warehouseoetzidev/core/src/entities/devices";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type DevicesListProps = {
  data: Accessor<DeviceInfo[]>;
};

export function DevicesList(props: DevicesListProps) {
  const [search, setSearch] = createSignal("");

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

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (term.length === 0) {
      return set;
    }

    const options: IFuseOptions<DeviceInfo> = {
      keys: ["name", "type.name", "description"],
      includeScore: true,
      threshold: 0.3,
    };

    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="sticky top-12 z-10 flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search devices" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderDeviceItem}
        emptyMessage="No devices have been added"
        noResultsMessage="No devices have been found"
        searchTerm={search}
      />
    </div>
  );
}
