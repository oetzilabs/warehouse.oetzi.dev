import { cn } from "@/lib/utils";
import { A } from "@solidjs/router";
import { type SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import { Accessor, For, Show } from "solid-js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type SalesListProps = {
  data: Accessor<SaleInfo[]>;
};

export const SalesList = (props: SalesListProps) => {
  return (
    <div class="w-full flex flex-col gap-4">
      <For
        each={props.data()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No sales have been added</span>
          </div>
        }
      >
        {(sale) => (
          <A
            href={`./${sale.id}`}
            class="flex flex-col gap-4 w-full h-content min-h-40 p-4 border rounded-lg hover:bg-primary-foreground hover:border-primary/50 shadow-sm hover:shadow-primary/10 transition-colors"
          >
            <div class="flex flex-row items-center gap-4 justify-between w-full h-content">
              <div class="flex flex-row gap-4 items-center justify-start">
                <span class="text-sm font-medium leading-none">{sale.customer.name}</span>
              </div>
              <div class="flex flex-row items-center gap-2">
                <Avatar class="size-6 border border-primary">
                  <AvatarImage
                    src={
                      (sale.customer.image?.length ?? 0) > 0
                        ? sale.customer.image!
                        : `https://avatar.iran.liara.run/public/boy?username=${sale.customer.name}`
                    }
                  />
                  <AvatarFallback>
                    {sale.customer.name
                      .toUpperCase()
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div class="flex flex-col gap-2 w-full h-full">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 w-full h-full">
                <For
                  each={sale.items}
                  fallback={
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground col-span-full bg-background">
                      <span class="text-sm select-none">No items added</span>
                    </div>
                  }
                >
                  {(item) => (
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-4 border bg-background">
                      <div class="flex flex-col gap-2 w-full h-full">
                        <span class="text-sm font-medium">{item.product.name}</span>
                        <span class="text-xs text-muted-foreground">
                          QTY & Price: {item.quantity} x {item.product.sellingPrice} {item.product.currency}
                        </span>
                        <Show when={item.product.weight}>
                          {(w) => (
                            <span class="text-xs text-muted-foreground">
                              Weight: {w().value} {w().unit}
                            </span>
                          )}
                        </Show>
                        <span class="text-xs text-muted-foreground">{item.product.sku}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex w-full grow"></div>
              <span class="text-xs">{dayjs(sale.updatedAt ?? sale.createdAt).format("MMM DD, YYYY - h:mm A")}</span>
            </div>
          </A>
        )}
      </For>
    </div>
  );
};
