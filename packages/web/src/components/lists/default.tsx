import { cn } from "@/lib/utils";
import { For, JSXElement, Show, splitProps } from "solid-js";

interface GenericListProps<T> {
  data: () => T[];
  filteredData: () => T[];
  renderItem: (item: T) => JSXElement;
  emptyMessage?: JSXElement;
  noResultsMessage?: JSXElement;
  searchTerm?: () => string;
  variant?: "list" | "grid";
  gridClass?: string;
  itemClass?: string;
  flexClass?: string;
}

export const GenericList = <T,>(props: GenericListProps<T>) => {
  const [local, others] = splitProps(props, ["variant", "gridClass", "itemClass", "flexClass"]);
  const variant = () => local.variant ?? "list";
  return (
    <div
      class={cn(
        "h-content",
        {
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4": variant() === "grid",
          "flex flex-col gap-4": variant() === "list" || others.data().length === 0,
        },
        local.gridClass,
        local.flexClass,
      )}
    >
      <For
        each={others.filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground w-full">
            <span class="text-sm select-none">
              <Show when={others.data().length === 0}>{others.emptyMessage ?? "No items have been added"}</Show>
              <Show when={others.data().length > 0 && (others.searchTerm?.()?.length ?? 0) > 0}>
                {others.noResultsMessage ?? "No items have been found"}
              </Show>
            </span>
          </div>
        }
      >
        {(item) => (
          <div
            class={cn(
              "flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all",
              local.itemClass,
            )}
          >
            {others.renderItem(item)}
          </div>
        )}
      </For>
    </div>
  );
};
