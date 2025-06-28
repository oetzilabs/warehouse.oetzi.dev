import { cn } from "@/lib/utils";
import { splitProps, type ComponentProps } from "solid-js";

export const Skeleton = (props: ComponentProps<"div">) => {
  const [local, rest] = splitProps(props, ["class"]);

  return <div class={cn("animate-pulse rounded-md bg-primary/10 dark:bg-neutral-800", local.class)} {...rest} />;
};
