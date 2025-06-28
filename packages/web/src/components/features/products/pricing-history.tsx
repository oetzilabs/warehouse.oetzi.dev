import { LineChart } from "@/components/ui/charts";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import { Accessor, createMemo, Show } from "solid-js";

type PricingHistoryProps = {
  product: Accessor<ProductInfo>;
};

export const PricingHistory = (props: PricingHistoryProps) => {
  const priceData = createMemo(() => {
    // Get all price history entries from all suppliers
    const supplierPrices = props.product().suppliers.flatMap((s) =>
      s.priceHistory.map((ph) => ({
        date: ph.effectiveDate,
        price: ph.supplierPrice,
        type: "supplier",
      })),
    );

    // Get organization selling price history
    const sellingPrices = props.product().priceHistory.map((ph) => ({
      date: ph.effectiveDate,
      price: ph.sellingPrice,
      type: "organization",
    }));

    // Combine and sort all prices by date
    const allPrices = supplierPrices.concat(sellingPrices).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Get unique dates for labels
    const labels = Array.from(new Set(allPrices.map((p) => dayjs(p.date).format("MMM DD, YYYY"))));

    // Separate data for each line
    const supplierData = labels.map((label) => {
      const price = allPrices.find((p) => p.type === "supplier" && dayjs(p.date).format("MMM DD, YYYY") === label);
      return price?.price ?? null;
    });

    const sellingData = labels.map((label) => {
      const price = allPrices.find((p) => p.type === "organization" && dayjs(p.date).format("MMM DD, YYYY") === label);
      return price?.price ?? null;
    });

    return { labels, supplierData, sellingData, hasHistory: supplierPrices.length > 1 || sellingPrices.length > 1 };
  });

  return (
    <div class="flex flex-col gap-4 py-2">
      <Show
        when={priceData().hasHistory}
        fallback={
          <div class="flex flex-col items-center justify-center p-8 bg-muted-foreground/5 dark:bg-muted/30 rounded-lg border">
            <span class="text-sm text-muted-foreground">There is no history for this product.</span>
          </div>
        }
      >
        <div class="flex flex-col gap-2 w-full h-[200px]">
          <LineChart
            data={{
              labels: priceData().labels,
              datasets: [
                {
                  label: "Supplier Price",
                  data: priceData().supplierData,
                  fill: false,
                  pointRadius: 0,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgb(239, 68, 68)",
                  tension: 0.3,
                },
                {
                  label: "Selling Price",
                  data: priceData().sellingData,
                  fill: false,
                  pointRadius: 0,
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderColor: "rgb(59, 130, 246)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false, // Hide vertical grid lines entirely
                  },
                  border: {
                    display: false, // Hide x-axis line
                  },
                  ticks: {
                    display: false,
                  },
                },
                y: {
                  border: {
                    dash: [4, 4], // Keep dashed grid lines
                    display: false, // Hide y-axis line (vertical line on the left)
                  },
                  grid: {
                    display: false,
                  },
                  ticks: {
                    display: false,
                  },
                },
              },
            }}
            height={200}
          />
        </div>
      </Show>
    </div>
  );
};
