import { SuppliersList } from "@/components/lists/suppliers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSuppliers } from "@/lib/api/suppliers";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Forklift from "lucide-solid/icons/forklift";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const suppliers = await getSuppliers();
    return { user, sessionToken, suppliers };
  },
} as RouteDefinition;

export default function SuppliersPage() {
  const data = createAsync(() => getSuppliers(), { deferStream: true });

  return (
    <div class="flex flex-col-reverse md:flex-row w-full h-full gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-row h-full gap-4 p-4 border-r-0 md:border-r md:overflow-auto">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full ">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <Forklift class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Suppliers</h1>
            </div>
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
                    <span class="sr-only md:not-sr-only">Create New</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload class="size-4" />
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Show when={data()}>{(suppliersList) => <SuppliersList data={suppliersList} />}</Show>
        </div>
      </div>

      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}
