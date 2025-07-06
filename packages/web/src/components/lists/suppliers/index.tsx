import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { A } from "@solidjs/router";
import { type SupplierInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, Show } from "solid-js";
import { GenericList } from "../default";

type SuppliersListProps = {
  data: Accessor<SupplierInfo[]>;
};

export const SuppliersList = (props: SuppliersListProps) => {
  const [search, setSearch] = createSignal("");

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

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<SupplierInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "description", "email", "phone", "contacts.name", "contacts.email"],
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
          <TextFieldInput placeholder="Search suppliers" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderSupplierItem}
        emptyMessage="No suppliers have been added"
        noResultsMessage="No suppliers have been found"
        searchTerm={search}
      />
    </div>
  );
};
