import type { UserSession } from "@/lib/api/auth";
// import { getMetrics } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import Box from "lucide-solid/icons/box";
import TrendingDown from "lucide-solid/icons/trending-down";
import TrendingUp from "lucide-solid/icons/trending-up";
import { For, JSX } from "solid-js";

type MetricDirection = "up" | "down" | "neutral";

const metricIcons: Record<MetricDirection, JSX.Element> = {
  up: <TrendingUp class="w-4 h-4" />,
  down: <TrendingDown class="w-4 h-4" />,
  neutral: <Box class="w-4 h-4" />,
};

export const Metrics = (props: { session: UserSession }) => {
  // const metrics = createAsync(() => getMetrics(), { deferStream: true });

  return (
    <div class="w-full grid md:grid-cols-3 grid-cols-1">
      {/* <For each={metrics()}>
        {(stat) => (
          <div class="flex flex-col gap-4 p-5 border-r last-of-type:border-none border-neutral-200 dark:border-neutral-800">
            <div class="flex flex-row items-start justify-between gap-1">
              <div class="flex flex-row gap-2 items-center">
                <span class="text-base lg:text-lg xl:text-xl font-bold capitalize">
                  {stat.value.v} {stat.value.unit}
                </span>
                <span class="text-xs font-medium text-muted-foreground">({stat.change}%)</span>
              </div>
              <div
                class={cn({
                  "text-emerald-400": stat.trend === "up",
                  "text-rose-400": stat.trend === "down",
                  "text-blue-400": stat.trend === "neutral",
                })}
              >
                {metricIcons[stat.trend]}
              </div>
            </div>
            <div class="flex flex-row items-start justify-between gap-2">
              <div class="flex flex-row gap-2 items-center">
                <span class="text-xs text-muted-foreground">
                  Total {stat.value.unit} in a {stat.duration}
                </span>
              </div>
              <div class="text-muted-foreground"></div>
            </div>
          </div>
        )}
      </For> */}
    </div>
  );
};
