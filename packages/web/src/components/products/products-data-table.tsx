import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/solid-table";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import IconChevronDown from "lucide-solid/icons/chevron-down";
import IconDots from "lucide-solid/icons/ellipsis";
import { Accessor, createEffect, createSignal, For } from "solid-js";
import { fuzzyFilter } from "../filters/fuzzyFilter";
import { columns } from "./columns";

export function ProductsDataTable(props: {
  data: Accessor<ProductInfo[]>;
  onSelectedProdcuts: (products: ProductInfo[]) => void;
}) {
  const [sorting, setSorting] = createSignal<SortingState>([]);
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});
  const [rowSelection, setRowSelection] = createSignal<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = createSignal("");

  createEffect(() => {
    props.onSelectedProdcuts(Object.keys(rowSelection()).map((k) => props.data()[parseInt(k)]));
  });

  const table = createSolidTable({
    get data() {
      return props.data();
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
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
      get globalFilter() {
        return globalFilter();
      },
    },
    globalFilterFn: "fuzzy",
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  });

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex items-center gap-4 justify-between w-full">
        <TextField value={globalFilter()} onChange={setGlobalFilter} class="w-full">
          <TextFieldInput placeholder="Filter orders..." class="max-w-full leading-none rounded-lg px-4" />
        </TextField>
        <DropdownMenu placement="bottom-end">
          <DropdownMenuTrigger as={Button} size="sm">
            Columns <IconChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <For each={table.getAllColumns().filter((column) => column.getCanHide())}>
              {(column) => (
                <DropdownMenuCheckboxItem
                  class="capitalize"
                  checked={column.getIsVisible()}
                  onChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              )}
            </For>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <TableRow>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <TableHead>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow data-state={row.getIsSelected() && "selected"}>
                  <For each={row.getVisibleCells()}>
                    {(cell) => <TableCell>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>}
                  </For>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} class="h-24 text-center text-muted-foreground">
                  No products.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div class="flex items-center justify-end space-x-2">
        <div class="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div class="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
