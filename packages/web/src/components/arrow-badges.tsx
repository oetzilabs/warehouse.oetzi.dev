import ArrowDown from "lucide-solid/icons/arrow-down";
import ArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUp from "lucide-solid/icons/arrow-up";
import { Match, Switch } from "solid-js";

type ArrowBadgeProps = {
  value: number;
};

export default function ArrowBadge(props: ArrowBadgeProps) {
  return (
    <div class="flex flex-wrap justify-center gap-4 text-xs">
      <Switch
        fallback={
          <span class="inline-flex items-center gap-x-1 rounded-tremor-small bg-neutral-200/10 px-2 py-1 font-semibold text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-300 rounded-md border">
            N/A
          </span>
        }
      >
        <Match when={props.value > 0}>
          <span class="inline-flex items-center gap-x-1 rounded-tremor-small bg-emerald-100 px-2 py-1 text-tremor-label font-semibold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-500">
            <ArrowUp class="size-4" aria-hidden={true} />
            {props.value}%
          </span>
        </Match>
        <Match when={props.value === 0}>
          <span class="inline-flex items-center gap-x-1 rounded-tremor-small bg-neutral-200/10 px-2 py-1 font-semibold text-neutral-700 dark:bg-neutral-500/30 dark:text-neutral-300 rounded-md border">
            <ArrowRight class="size-4" aria-hidden={true} />
            0%
          </span>
        </Match>
        <Match when={props.value < 0}>
          <span class="inline-flex items-center gap-x-1 rounded-tremor-small bg-red-100 px-2 py-1 text-tremor-label font-semibold text-red-800 dark:bg-red-400/20 dark:text-red-500">
            <ArrowDown class="size-4" aria-hidden={true} />
            {props.value}%
          </span>
        </Match>
      </Switch>
    </div>
  );
}
