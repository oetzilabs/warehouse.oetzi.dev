import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/solid-table";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import { For, Show } from "solid-js";
import { labels, statuses } from "./data";
import { TableColumnHeader } from "./table-column-header";
import { TableRowActions } from "./table-row-actions";

export const columns: ColumnDef<CustomerOrderByOrganizationIdInfo>[] = [
  {
    id: "select",
    header: (props) => (
      <Checkbox
        checked={props.table.getIsAllPageRowsSelected()}
        indeterminate={props.table.getIsSomePageRowsSelected()}
        onChange={(value) => props.table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        class="translate-y-[4px]"
      />
    ),
    cell: (props) => (
      <Checkbox
        checked={props.row.getIsSelected()}
        onChange={(value) => props.row.toggleSelected(!!value)}
        aria-label="Select row"
        class="translate-y-[4px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: (props) => <TableColumnHeader column={props.column} title="Task" />,
    cell: (props) => <div class="w-[80px]">{props.row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: (props) => <TableColumnHeader column={props.column} title="Title" />,
    cell: (props) => {
      const label = () => labels.find((label) => label.value === props.row.original.label);

      return (
        <div class="flex space-x-2">
          <Show when={label()} keyed>
            {(label) => <Badge variant="outline">{label.label}</Badge>}
          </Show>
          <span class="max-w-[500px] truncate font-medium">{props.row.getValue("title")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: (props) => <TableColumnHeader column={props.column} title="Status" />,
    cell: (props) => {
      const status = () => statuses.find((status) => status.value === props.row.getValue("status"));
      return (
        <Show when={status()} keyed>
          {(status) => (
            <div class="flex w-[100px] items-center">
              {status.icon && <status.icon class="mr-2 size-4 text-muted-foreground" />}
              <span>{status.label}</span>
            </div>
          )}
        </Show>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "products",
    header: (props) => <TableColumnHeader column={props.column} title="Products" />,
    cell: (props) => {
      return (
        <For each={props.getValue()} keyed>
          {(product) => (
            <div class="flex items-center">
              <span>{product.product.name}</span>
            </div>
          )}
        </For>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: (props) => <TableRowActions row={props.row} />,
  },
];
