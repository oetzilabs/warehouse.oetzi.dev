import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { A } from "@solidjs/router";
import { type CustomerInfo } from "@warehouseoetzidev/core/src/entities/customers";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, Show } from "solid-js";
import { GenericList } from "../default";

type CustomersListProps = {
  data: Accessor<CustomerInfo[]>;
};

export const CustomersList = (props: CustomersListProps) => {
  const [search, setSearch] = createSignal("");

  const renderCustomerItem = (customer: CustomerInfo) => (
    <>
      <div
        class={cn("flex flex-col w-full", {
          "opacity-70": customer.deletedAt,
        })}
      >
        <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
          <div class="flex flex-row gap-4 items-center">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">{customer.name}</span>
              <span class="text-xs text-muted-foreground">
                {dayjs(customer.updatedAt ?? customer.createdAt).format("MMM DD, YYYY - h:mm A")}
              </span>
            </div>
            <Show when={customer.deletedAt}>
              <span class="text-xs text-red-500">Deleted</span>
            </Show>
          </div>
          <Button as={A} href={`./${customer.id}`} size="sm" class="gap-2">
            Open
            <ArrowUpRight class="size-4" />
          </Button>
        </div>
        <div class="flex flex-col p-4 gap-2">
          <span class="text-xs text-muted-foreground">Email: {customer.email}</span>
          <span class="text-xs text-muted-foreground">Phone: {customer.phone}</span>
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
    const options: IFuseOptions<CustomerInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "description", "email", "phone"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search customers" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>
      <div class="flex flex-col gap-4 grow overflow-auto">
        <GenericList
          data={props.data}
          filteredData={filteredData}
          renderItem={renderCustomerItem}
          emptyMessage="No customers have been added"
          noResultsMessage="No customers have been found"
          searchTerm={search}
          flexClass="gap-4"
        />
      </div>
    </div>
  );
};
