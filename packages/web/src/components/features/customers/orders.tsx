import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import { CustomerInfo } from "@warehouseoetzidev/core/src/entities/customers";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Database from "lucide-solid/icons/database";
import Plus from "lucide-solid/icons/plus";
import { Accessor, For, Show } from "solid-js";

type OrdersProps = {
  customer: Accessor<CustomerInfo>;
};

export const Orders = (props: OrdersProps) => {
  return (
    <div class="flex flex-col border rounded-lg">
      <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b bg-muted-foreground/5 dark:bg-muted/30">
        <h2 class="font-medium">Orders</h2>
        <div class="flex flex-row items-center">
          <Button size="sm">
            <Plus class="size-4" />
            Place Order
          </Button>
        </div>
      </div>
      <div class="flex flex-col w-full">
        <Show when={props.customer().orders.length === 0}>
          <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full">
            <span class="text-sm text-muted-foreground">No orders have been made</span>
            <div class="flex flex-row gap-2 items-center justify-center">
              <Button size="sm">
                <Plus class="size-4" />
                Place Order
              </Button>
              <Button size="sm" variant="outline" class="bg-background">
                <Database class="size-4" />
                Import
              </Button>
            </div>
          </div>
        </Show>
        <Show when={props.customer().orders.length > 0}>
          <div class="flex flex-col gap-0">
            <For each={props.customer().orders.slice(0, 10)}>
              {(o) => (
                <div class="flex flex-row items-center justify-between p-4 border-b last:border-b-0">
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-sm font-medium">#{o.barcode ?? "N/A"}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{o.status}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs text-muted-foreground">{dayjs(o.createdAt).format("MMM D, YYYY")}</span>
                      <span class="text-xs text-muted-foreground">
                        {o.products.length} product{o.products.length === 1 ? "" : "s"} •{" "}
                        {o.products.map((p) => p.quantity).reduce((a, b) => a + b, 0)} items
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" class="bg-background" size="sm" as={A} href={`/orders/${o.id}`}>
                    View
                    <ArrowUpRight class="size-4" />
                  </Button>
                </div>
              )}
            </For>
            <Show when={props.customer().orders.length > 10}>
              <div class="flex flex-row items-center justify-center p-4 border-t bg-muted/30">
                <Button as={A} href="./orders" variant="ghost" size="sm" class="gap-2">
                  Show All Orders ({props.customer().orders.length})
                  <ArrowUpRight class="size-4" />
                </Button>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};
