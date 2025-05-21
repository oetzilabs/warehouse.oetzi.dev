import { Component, createEffect, createSignal, For, ParentProps, Show } from "solid-js";
import { cn } from "../lib/utils";

type StatusType =
  | "online"
  | "offline"
  | "unresponsive"
  | "unknown"
  | "shutting-down"
  | "rebooting"
  | "maintenance"
  | "error";

type StatusBadgeProps = {
  status: StatusType;
};

const statusColorMap: Record<StatusType, { text: string; bg: string }> = {
  online: {
    text: "text-emerald-700 dark:text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/20",
  },
  offline: {
    text: "text-red-700 dark:text-red-500",
    bg: "bg-red-50 dark:bg-red-500/20",
  },
  unresponsive: {
    text: "text-orange-700 dark:text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-500/20",
  },
  unknown: {
    text: "text-gray-700 dark:text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-500/20",
  },
  "shutting-down": {
    text: "text-yellow-700 dark:text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-500/20",
  },
  rebooting: {
    text: "text-blue-700 dark:text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/20",
  },
  maintenance: {
    text: "text-purple-700 dark:text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/20",
  },
  error: {
    text: "text-red-700 dark:text-red-500",
    bg: "bg-red-50 dark:bg-red-500/20",
  },
};

export const StatusBadge = (props: ParentProps<StatusBadgeProps>) => {
  return (
    <span
      class={cn(
        "inline-flex items-center space-x-1.5 rounded-tremor-full px-2.5 py-1 ring-1 ring-inset",
        statusColorMap[props.status].bg,
        "ring-tremor-ring dark:ring-dark-tremor-ring",
      )}
    >
      <span class={cn("text-tremor-label font-medium", statusColorMap[props.status].text)}>
        {props.status.replace("-", " ")}
      </span>
    </span>
  );
};
