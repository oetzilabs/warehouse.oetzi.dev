import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { A, useSearchParams } from "@solidjs/router";
import { For, type JSX, Show } from "solid-js";

type Props = {
  isCollapsed: boolean;
  selected?: string;
  links: {
    title: string;
    s_tab: string;
    label?: string;
    icon: JSX.Element;
    selected: boolean;
  }[];
};

export const Nav = (props: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <div data-collapsed={props.isCollapsed} class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <For each={props.links}>
          {(item) => (
            <Show
              when={props.isCollapsed}
              fallback={
                <Button
                  variant={item.selected ? "default" : "ghost"}
                  size="sm"
                  class={cn("text-sm justify-start", {
                    "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white hover:text-white":
                      item.selected,
                  })}
                  onClick={() => {
                    setSearchParams({ s_tab: item.s_tab });
                  }}
                >
                  <div class="mr-2">{item.icon}</div>
                  {item.title}
                  <Show when={item.label && item.label !== "0" && item.label}>
                    {(l) => (
                      <span
                        class={cn("ml-auto", {
                          "text-background dark:text-white": item.selected,
                        })}
                      >
                        {l()}
                      </span>
                    )}
                  </Show>
                </Button>
              }
            >
              <Tooltip openDelay={0} closeDelay={0} placement="right">
                <TooltipTrigger
                  class={cn(
                    buttonVariants({
                      variant: item.selected ? "default" : "ghost",
                      size: "icon",
                    }),
                    "h-9 w-9",
                    {
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white":
                        item.selected,
                    }
                  )}
                  onClick={() => {
                    setSearchParams({ s_tab: item.s_tab });
                  }}
                >
                  {item.icon}
                  <span class="sr-only">{item.title}</span>
                </TooltipTrigger>
                <TooltipContent class="flex items-center gap-4">
                  {item.title}
                  <Show when={item.label && item.label !== "0" && item.label}>
                    {(l) => (
                      <span
                        class={cn("ml-auto", {
                          "text-background dark:text-white": item.selected,
                        })}
                      >
                        {l()}
                      </span>
                    )}
                  </Show>
                </TooltipContent>
              </Tooltip>
            </Show>
          )}
        </For>
      </nav>
    </div>
  );
};
