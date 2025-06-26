import { cn } from "@/lib/utils";
import { Component, ParentProps, splitProps } from "solid-js";

type OrderStatusType = "pending" | "processing" | "completed" | "cancelled" | "draft";

type OrderStatusBadgeProps = {
  status: OrderStatusType;
  class?: string;
};

const statusColorMap: Record<OrderStatusType, { text: string; bg: string; bg2: string; ring: string }> = {
  pending: {
    text: "text-yellow-700 dark:text-yellow-500",
    bg: "bg-yellow-500",
    bg2: "bg-yellow-500",
    ring: "ring-yellow-500",
  },
  processing: {
    text: "text-blue-700 dark:text-blue-500",
    bg: "bg-blue-500",
    bg2: "bg-blue-500",
    ring: "ring-blue-500",
  },
  completed: {
    text: "text-emerald-700 dark:text-emerald-500",
    bg: "bg-emerald-500",
    bg2: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  cancelled: {
    text: "text-red-700 dark:text-red-500",
    bg: "bg-red-500",
    bg2: "bg-red-500",
    ring: "ring-red-500",
  },
  draft: {
    text: "text-neutral-700 dark:text-neutral-500",
    bg: "bg-neutral-500",
    bg2: "bg-neutral-500",
    ring: "ring-neutral-500",
  },
};

export const OrderStatusBadge = (props: ParentProps<OrderStatusBadgeProps>) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "flex flex-col rounded-full h-9 w-1",
        statusColorMap[props.status].bg,
        statusColorMap[props.status].ring,
        local.class,
      )}
      {...others}
    />
  );
};
