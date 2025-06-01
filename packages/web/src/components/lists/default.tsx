import { For, JSXElement, Show } from "solid-js";

interface GenericListProps<T> {
  data: () => T[];
  filteredData: () => T[];
  renderItem: (item: T) => JSXElement;
  emptyMessage?: JSXElement;
  noResultsMessage?: JSXElement;
  searchTerm?: () => string;
}

export const GenericList = <T,>(props: GenericListProps<T>) => {
  return (
    <For
      each={props.filteredData()}
      fallback={
        <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
          <span class="text-sm select-none">
            <Show when={props.data().length === 0}>{props.emptyMessage ?? "No items have been added"}</Show>
            <Show when={props.data().length > 0 && (props.searchTerm?.()?.length ?? 0) > 0}>
              {props.noResultsMessage ?? "No items have been found"}
            </Show>
          </span>
        </div>
      }
    >
      {(item) => (
        <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
          {props.renderItem(item)}
        </div>
      )}
    </For>
  );
};
