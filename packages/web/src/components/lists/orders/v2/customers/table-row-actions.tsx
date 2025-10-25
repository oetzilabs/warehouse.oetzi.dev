import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Row } from "@tanstack/solid-table";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import Dots from "lucide-solid/icons/ellipsis";
import { For } from "solid-js";
import { labels } from "./data";

type TableRowActionsProps<T> = {
  row: Row<T>;
};

export function TableRowActions(props: TableRowActionsProps<CustomerOrderByOrganizationIdInfo>) {
  return (
    <DropdownMenu placement="bottom-end">
      <DropdownMenuTrigger as={Button<"button">} variant="ghost" class="flex size-8 p-0 data-[state=open]:bg-muted">
        <Dots class="size-3" />
        <span class="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub overlap>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={props.row.original.label}>
                <For each={labels}>
                  {(label) => <DropdownMenuRadioItem value={label.value}>{label.label}</DropdownMenuRadioItem>}
                </For>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
