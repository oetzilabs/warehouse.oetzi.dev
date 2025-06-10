import type { InventoryAlertInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Show, type Component } from "solid-js";

dayjs.extend(relativeTime);

export const LastOrderInfo: Component<{
  product: InventoryAlertInfo[number]["product"];
}> = (props) => {
  const lastPurchase = () => {
    // Find all completed purchases across all suppliers
    const purchases = props.product.suppliers.reduce(
      (acc, supplier) => {
        const supplierPurchases = supplier.supplier.purchases
          .filter((p) => p.status === "completed")
          .map((p) => ({
            ...p,
            supplierName: supplier.supplier.name, // Add supplier name to each purchase
          }));
        return [...acc, ...supplierPurchases];
      },
      [] as ((typeof props.product.suppliers)[number]["supplier"]["purchases"][number] & { supplierName: string })[],
    );

    // Sort by date and get the most recent
    return purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  return (
    <div class="flex-1 text-sm text-muted-foreground">
      <Show when={lastPurchase()} fallback={<div>No previous purchases</div>}>
        {(lp) => (
          <span>
            Last purchased {dayjs(lp().createdAt).fromNow()} - Amount:{" "}
            {lp()
              .products.filter((p) => p.product.id === props.product.id)
              .reduce((sum, p) => sum + p.quantity, 0)}{" "}
            from {lp().supplierName}
          </span>
        )}
      </Show>
    </div>
  );
};
