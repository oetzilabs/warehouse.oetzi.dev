import { SuppliersList } from "@/components/lists/suppliers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getSuppliers } from "@/lib/api/suppliers";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    getAuthenticatedUser();
    getSuppliers();
  },
} as RouteDefinition;

export default function SuppliersPage() {
  const data = createAsync(() => getSuppliers(), { deferStream: true });

  return (
    <Show when={data()}>
      {(suppliersList) => (
        <div class="container flex flex-col grow py-8">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full ">
                <h1 class="font-semibold leading-none">Suppliers</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getSuppliers.key), {
                        loading: "Refreshing suppliers...",
                        success: "Suppliers refreshed",
                        error: "Failed to refresh suppliers",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <DropdownMenu placement="bottom-end">
                    <DropdownMenuTrigger as={Button} size="sm" class="pl-2.5 rounded-l-none">
                      <Plus class="size-4" />
                      Add Supplier
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem as={A} href="/suppliers/new" class="cursor-pointer">
                        <Plus class="size-4" />
                        Create New
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Upload class="size-4" />
                        Import
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <SuppliersList data={suppliersList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
