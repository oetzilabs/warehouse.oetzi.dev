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
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const user = await getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = await getSessionToken();
    const suppliers = await getSuppliers();
    return { user, sessionToken, suppliers };
  },
} as RouteDefinition;

export default function SuppliersPage() {
  const data = createAsync(() => getSuppliers(), { deferStream: true });

  return (
    <Show when={data()}>
      {(suppliersList) => (
        <div class="container flex flex-col grow py-0 relative">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full ">
                <div class="flex flex-row items-center gap-4">
                  <Button variant="outline" size="sm" as={A} href="/dashboard" class="bg-background">
                    <ArrowLeft class="size-4" />
                    Back
                  </Button>
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
              <SuppliersList data={suppliersList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
