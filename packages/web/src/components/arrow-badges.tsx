import ArrowDown from "lucide-solid/icons/arrow-down";
import ArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUp from "lucide-solid/icons/arrow-up";
import CircleHelp from "lucide-solid/icons/circle-help";
import { Match, splitProps, Switch } from "solid-js";
import { cn } from "../lib/utils";
import "@fontsource-variable/geist-mono";

type ArrowBadgeProps = {
  value: number;
  class?: string;
};

export default function ArrowBadge(props: ArrowBadgeProps) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("flex flex-wrap justify-center items-center gap-4 text-xs font-['Geist_Mono_Variable']", local.class)}
      {...others}
    >
      <Switch
        fallback={
          <span class="inline-flex items-center gap-x-1 bg-neutral-200/10 px-1 pl-2 py-1 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-300 rounded-md border">
            N/A
            <CircleHelp class="size-4" />
          </span>
        }
      >
        <Match when={props.value > 0}>
          <span class="inline-flex items-center gap-x-1 bg-emerald-100 px-1 pl-2 py-1 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-500">
            {props.value}%
            <ArrowUp class="size-4" aria-hidden={true} />
          </span>
        </Match>
        <Match when={props.value === 0}>
          <span class="inline-flex items-center gap-x-1 bg-neutral-200/10 px-1 pl-2 py-1 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400 rounded-md border">
            0%
            <ArrowRight class="size-4" aria-hidden={true} />
          </span>
        </Match>
        <Match when={props.value < 0}>
          <span class="inline-flex items-center gap-x-1 bg-red-100 px-1 pl-2 py-1 text-red-800 dark:bg-red-400/20 dark:text-red-500">
            {props.value}%
            <ArrowDown class="size-4" aria-hidden={true} />
          </span>
        </Match>
      </Switch>
    </div>
  );
}
