import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import { GenericList } from "../default";

type SalesListProps = {
  data: Accessor<SaleInfo[]>;
};

export function SalesList(props: SalesListProps) {
  const [search, setSearch] = createSignal("");

  const renderSaleItem = (sale: SaleInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">Sale #{sale.id}</span>
            <span class="text-xs text-muted-foreground">
              {dayjs(sale.updatedAt ?? sale.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <Button as={A} href={`/sales/${sale.id}`} size="sm" class="gap-2">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>

      <div class="flex flex-col">
        <For
          each={sale.items.slice(0, 5)}
          fallback={
            <div class="flex items-center justify-center p-8 text-sm text-muted-foreground">No items added</div>
          }
        >
          {(item) => (
            <div class="flex flex-col border-b last:border-b-0 p-4 gap-4">
              <div class="flex flex-col">
                <div class="flex flex-row items-center justify-between">
                  <div class="flex flex-row items-center gap-2">
                    <div class="text-xs bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-lg border inline-flex items-center gap-1 ">
                      <span class="font-normal font-['Geist_Mono_Variable']">{item.quantity}</span>
                      <span>×</span>
                    </div>
                    <span class="font-medium">{item.product.name}</span>
                  </div>
                  <div class="flex flex-row items-center gap-1">
                    <span class="text-sm text-muted-foreground">
                      {item.product.sellingPrice.toFixed(2)} {item.product.currency}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex flex-row items-end justify-between">
                <div class="flex flex-col gap-2">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
                    <Show when={item.product.organizations[0].tg}>
                      {(tg) => (
                        <span class="text-sm text-muted-foreground">
                          {tg().name} ({tg().crs[0]?.tr.rate}%)
                        </span>
                      )}
                    </Show>
                    <Show when={item.product.weight}>
                      {(weight) => <span class="text-xs text-muted-foreground">Weight</span>}
                    </Show>
                  </div>
                </div>
                <div class="flex flex-col items-end font-normal font-['Geist_Mono_Variable']">
                  <div class="flex flex-row items-center gap-1">
                    <span class="text-xs text-muted-foreground">
                      {(item.product.sellingPrice * item.quantity).toFixed(2)} {item.product.currency}
                    </span>
                  </div>
                  <Show when={item.product.organizations[0].tg}>
                    <span class="text-xs text-muted-foreground">
                      {(
                        (item.product.sellingPrice *
                          item.quantity *
                          (item.product.organizations[0].tg!.crs[0]?.tr.rate ?? 0)) /
                        100
                      ).toFixed(2)}{" "}
                      {item.product.currency} Tax
                    </span>
                  </Show>
                  <Show when={item.product.weight}>
                    {(weight) => (
                      <span class="text-xs text-muted-foreground">
                        {weight().value} {weight().unit}
                      </span>
                    )}
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={sale.items.length > 5}>
          <div class="flex flex-row items-center justify-between p-4 border-t bg-muted/30">
            <span class="text-sm text-muted-foreground">+ {sale.items.length - 5} more items</span>
            <span class="text-sm text-muted-foreground">
              {sale.items
                .slice(5)
                .reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0)
                .toFixed(2)}{" "}
              {sale.items[0].product.currency}
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
    const options: IFuseOptions<SaleInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["title", "items.product.name", "items.product.sku"],
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
          <TextFieldInput placeholder="Search sales" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <div class="flex flex-col gap-4 w-full grow">
        <GenericList
          data={props.data}
          filteredData={filteredData}
          renderItem={renderSaleItem}
          emptyMessage="No sales have been added"
          noResultsMessage="No sales have been found"
          searchTerm={search}
          flexClass="gap-4"
        />
      </div>
    </div>
  );
}
