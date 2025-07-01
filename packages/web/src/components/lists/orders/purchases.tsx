import { OrderStatusBadge } from "@/components/badges/order-status";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { type SupplierPurchaseInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import { GenericList } from "../default";

type PurchasesListProps = {
  data: Accessor<SupplierPurchaseInfo[]>;
};

export const PurchasesList = (props: PurchasesListProps) => {
  const [search, setSearch] = createSignal("");

  const renderPurchaseItem = (item: SupplierPurchaseInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <OrderStatusBadge status={item.status} />
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row gap-2">
              <span class="text-sm font-medium">{item.title}</span>
            </div>
            <span class="text-xs text-muted-foreground">
              {dayjs(item.updatedAt ?? item.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <Button as={A} href={`/purchases/${item.id}`} size="sm" class="gap-2">
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

      <div class="flex flex-col">
        <For
          each={item.products.slice(0, 5)}
          fallback={
            <div class="flex items-center justify-center p-8 text-sm text-muted-foreground">No products added</div>
          }
        >
          {(p) => (
            <div class="flex flex-col border-b last:border-b-0 p-4 gap-4">
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{p.product.name}</span>
                  <span class="text-xs text-muted-foreground">SKU: {p.product.sku}</span>
                  <Show when={p.product.weight}>
                    {(weight) => (
                      <span class="text-xs text-muted-foreground">
                        Weight: {weight().value} {weight().unit}
                      </span>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col items-end">
                  <div class="flex flex-row items-baseline gap-1">
                    <span class="text-xs text-muted-foreground">{p.quantity}x</span>
                    <span class="text-sm font-medium ">{p.product.sellingPrice.toFixed(2)}</span>
                  </div>
                  <span class="text-sm text-muted-foreground">
                    {(p.product.sellingPrice * p.quantity).toFixed(2)} {p.product.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={item.products.length > 5}>
          <div class="flex flex-row items-center justify-between p-4 border-t bg-muted/30">
            <span class="text-sm text-muted-foreground">+ {item.products.length - 5} more products</span>
            <span class="text-sm text-muted-foreground">
              {item.products
                .slice(5)
                .reduce((acc, p) => acc + p.product.sellingPrice * p.quantity, 0)
                .toFixed(2)}{" "}
              {item.products[0].product.currency}
            </span>
          </div>
        </Show>
      </div>
    </>
  );

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<SupplierPurchaseInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["title", "status", "products.product.name", "products.product.sku"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="sticky top-12 z-10 flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full "
        >
          <TextFieldInput placeholder="Search purchases" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderPurchaseItem}
        emptyMessage="No orders have been added"
        noResultsMessage="No orders have been found"
        searchTerm={() => search()}
      />
    </div>
  );
};
