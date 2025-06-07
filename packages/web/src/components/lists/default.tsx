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
}

export const GenericList = <T,>(props: GenericListProps<T>) => {
  const [local, others] = splitProps(props, ["variant"]);
  const variant = () => local.variant ?? "list";
  return (
    <div
      class={cn({
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4": variant() === "grid",
        "flex flex-col gap-4": variant() === "list",
      })}
    >
      <For
        each={others.filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
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
          <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
            {others.renderItem(item)}
          </div>
        )}
      </For>
    </div>
  );
};
