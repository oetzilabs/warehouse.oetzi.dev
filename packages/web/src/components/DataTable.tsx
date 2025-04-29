import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/solid-table";
import Eye from "lucide-solid/icons/eye";
import { Accessor, createSignal, For, JSX, Show, splitProps } from "solid-js";

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: Accessor<TData[] | undefined>;
  searchBy?: keyof TData & {};
  menu?: JSX.Element;
};

export const DataTable = <TData, TValue>(props: Props<TData, TValue>) => {
  const [local] = splitProps(props, ["columns", "data"]);
  const [sorting, setSorting] = createSignal<SortingState>([]);
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = createSignal({});
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});

  const table = createSolidTable({
    getCoreRowModel: getCoreRowModel(),
    // eslint-disable-next-line solid/reactivity
    columns: local.columns,
    get data() {
      const d = local.data();
      if (!d) return [];
      return d;
    },
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get sorting() {
        return sorting();
      },
      get columnFilters() {
        return columnFilters();
      },
      get columnVisibility() {
        return columnVisibility();
      },
      get rowSelection() {
        return rowSelection();
      },
    },
  });

  return (
    <div class="w-full h-full flex flex-col">
      <div class="flex items-center justify-between w-full p-2 border-b border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center">
          <Show when={props.searchBy}>
            {(searchBy) => (
              <TextFieldRoot class="w-full">
                <TextField
                  placeholder={`Filter ${String(searchBy())}...`}
                  value={(table.getColumn(String(searchBy()))?.getFilterValue() as string) ?? ""}
                  onInput={(event) => {
                    setColumnFilters((filters) => [...filters, { id: "filename", value: event.currentTarget.value }]);
                  }}
                  class="w-full h-8"
                />
              </TextFieldRoot>
            )}
          </Show>
        </div>
        <div class="flex flex-row items-center justify-end gap-2">
          <Show when={props.menu}>{(menu) => <div class="flex items-center">{menu()}</div>}</Show>
          <DropdownMenu>
            <DropdownMenuTrigger
              as={Button}
              variant="outline"
              class="flex flex-row items-center justify-center gap-2"
              size="sm"
            >
              <Eye class="size-4" />
              <span>View</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <For each={table.getAllColumns().filter((column) => column.getCanHide())}>
                {(item) => (
                  <DropdownMenuCheckboxItem
                    class="capitalize"
                    checked={item.getIsVisible()}
                    onChange={(value) => item.toggleVisibility(!!value)}
                  >
                    {item.id}
                  </DropdownMenuCheckboxItem>
                )}
              </For>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div class="flex flex-col w-full h-full">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow withHover={false}>
                  <For each={headerGroup.headers}>
                    {(header) => {
                      return (
                        <TableHead>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    }}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
          <TableBody>
            <Show
              when={table.getRowModel().rows?.length}
              fallback={
                <TableRow>
                  <TableCell colSpan={local.columns.length} class="">
                    No results.
                  </TableCell>
                </TableRow>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    <For each={row.getVisibleCells()}>
                      {(cell) => <TableCell>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>}
                    </For>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
        <div class="flex grow" />
        <div class="text-muted-foreground flex-1 text-sm w-full p-2 border-t border-neutral-200 dark:border-neutral-800 select-none">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
      </div>
    </div>
  );
};
