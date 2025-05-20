import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/solid-table";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import IconDots from "lucide-solid/icons/ellipsis";
import { For } from "solid-js";

export const columns: ColumnDef<ProductInfo>[] = [
  {
    id: "select",
    header: (props) => (
      <Checkbox
        checked={props.table.getIsAllPageRowsSelected()}
        indeterminate={props.table.getIsSomePageRowsSelected()}
        onChange={(value) => props.table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: (props) => (
      <Checkbox
        checked={props.row.getIsSelected()}
        onChange={(value) => props.row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: (props) => <div class="capitalize">{props.row.original.name}</div>,
    filterFn: "fuzzy",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (props) => <div class="capitalize">{props.row.original.status}</div>,
    filterFn: "fuzzy",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: (props) => <div>{props.row.original.createdAt.toLocaleString()}</div>,
    filterFn: "fuzzy",
  },
  {
    header: "Labels",
    cell: (props) => {
      return (
        <div class="flex flex-wrap gap-2">
          <For each={props.row.original.labels.map((l) => l.label)}>
            {(label) => <Badge class="text-xs">{label.name}</Badge>}
          </For>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: "Actions",
    cell: (props) => {
      return (
        <DropdownMenu placement="bottom-end">
          <DropdownMenuTrigger as={Button<"button">} variant="ghost" class="size-8 p-0">
            <span class="sr-only">Open menu</span>
            <IconDots />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(props.row.original.id)}>
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View order details</DropdownMenuItem>
            <DropdownMenuItem>Update status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
