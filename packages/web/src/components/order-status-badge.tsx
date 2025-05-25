import { Component, ParentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

type OrderStatusType = "pending" | "processing" | "completed" | "cancelled";

type OrderStatusBadgeProps = {
  status: OrderStatusType;
  class?: string;
};

const statusColorMap: Record<OrderStatusType, { text: string; bg: string; bg2: string; ring: string }> = {
  pending: {
    text: "text-yellow-700 dark:text-yellow-500",
    bg: "bg-yellow-200 dark:bg-yellow-500/20",
    bg2: "bg-yellow-500",
    ring: "ring-yellow-500",
  },
  processing: {
    text: "text-blue-700 dark:text-blue-500",
    bg: "bg-blue-200 dark:bg-blue-500/20",
    bg2: "bg-blue-500",
    ring: "ring-blue-500",
  },
  completed: {
    text: "text-emerald-700 dark:text-emerald-500",
    bg: "bg-emerald-200 dark:bg-emerald-500/20",
    bg2: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  cancelled: {
    text: "text-red-700 dark:text-red-500",
    bg: "bg-red-200 dark:bg-red-500/20",
    bg2: "bg-red-500",
    ring: "ring-red-500",
  },
};

export const OrderStatusBadge = (props: ParentProps<OrderStatusBadgeProps>) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <span
      class={cn(
        "flex items-center justify-center rounded-full p-1 ring-1 ring-inset",
        statusColorMap[props.status].bg,
        statusColorMap[props.status].ring,
        local.class,
      )}
    >
      <div class={cn("size-[6px] rounded-full", statusColorMap[props.status].bg2)}></div>
    </span>
  );
};
