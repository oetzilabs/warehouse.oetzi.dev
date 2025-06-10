import type { InventoryAlertInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Show, type Component } from "solid-js";

dayjs.extend(relativeTime);

export const LastOrderInfo: Component<{
  product: InventoryAlertInfo[number]["product"];
}> = (props) => {
  const lastOrder = props.product.orders
    .sort((a, b) => {
      const dateA = new Date(a.order.createdAt);
      const dateB = new Date(b.order.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .at(0);
  return (
    <div class="flex-1 text-sm text-muted-foreground">
      <Show when={lastOrder} fallback={<div>No previous orders</div>}>
        {(lo) => (
          <span>
            Last ordered {dayjs(lo().order.createdAt).fromNow()} - Amount:{" "}
            {lo()
              .order.prods.filter((p) => p.product.id === props.product.id)
              .reduce((sum, p) => sum + p.quantity, 0)}
          </span>
        )}
      </Show>
    </div>
  );
};
