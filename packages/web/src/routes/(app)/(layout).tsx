import { useUser } from "@/components/providers/User";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { changeFacility } from "@/lib/api/facilities";
import { changeWarehouse } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { A, useAction, useLocation, useResolvedPath, useSubmission } from "@solidjs/router";
import BadgeEuro from "lucide-solid/icons/badge-euro";
import BookOpenText from "lucide-solid/icons/book-open-text";
import Cpu from "lucide-solid/icons/cpu";
import Forklift from "lucide-solid/icons/forklift";
import Support from "lucide-solid/icons/heart-plus";
import Loader2 from "lucide-solid/icons/loader-2";
import MapIcon from "lucide-solid/icons/map";
import MessageSquare from "lucide-solid/icons/message-square";
import Notebook from "lucide-solid/icons/notebook";
import Package2 from "lucide-solid/icons/package-2";
import PackagePlus from "lucide-solid/icons/package-plus";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import Search from "lucide-solid/icons/search";
import Tags from "lucide-solid/icons/tags";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import UsersRound from "lucide-solid/icons/users-round";
import Warehouse from "lucide-solid/icons/warehouse";
import { For, JSXElement, ParentProps, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

const Link = (
  props: ParentProps<{
    href: string;
    disabled?: boolean;
  }>,
) => {
  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);
  return (
    <SidebarMenuButton
      class={cn("hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3 select-none", {
        "text-white bg-indigo-600 font-medium hover:bg-indigo-600": relativePath() === props.href,
        "opacity-50 hover:bg-transparent": props.disabled,
      })}
      as={props.disabled ? "div" : A}
      href={props.href}
    >
      {props.children}
    </SidebarMenuButton>
  );
};

export default function DashboardLayout(props: { children: JSXElement }) {
  const user = useUser();
  const changeWarehouseAction = useAction(changeWarehouse);
  const isChangingWarehouse = useSubmission(changeWarehouse);

  const changeFacilityAction = useAction(changeFacility);
  const isChangingFacility = useSubmission(changeFacility);

  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);

  return (
    <div class="w-full flex flex-col gap-0 h-full">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent class="gap-0">
            <SidebarGroup>
              <div class="w-full rounded-lg border px-3 py-2 text-sm cursor-pointer select-none flex flex-row items-center justify-between gap-4 text-muted-foreground hover:text-black dark:hover:text-white">
                <span class="">Search</span>
                <Search class="size-4" />
              </div>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Warehouses</SidebarGroupLabel>
              <SidebarGroupAction as={A} href="/warehouses/new" class="px-2 shrink-0 border ">
                <Plus />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Show when={user.currentOrganization()}>
                    {(org) => (
                      <>
                        <For each={org().whs.map((w) => w.warehouse)}>
                          {(wh) => (
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                onClick={() => {
                                  const cwh = user.currentWarehouse();
                                  if (cwh && cwh.id === wh.id) {
                                    toast.info("You are already on this warehouse");
                                    return;
                                  }
                                  if (isChangingWarehouse.pending) return;
                                  toast.promise(changeWarehouseAction(wh.id), {
                                    loading: "Changing facility...",
                                    success: "Facility changed",
                                    error: "Failed to change facility",
                                  });
                                }}
                                class={cn(
                                  "hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3 select-none",
                                  {
                                    "text-white bg-indigo-600 font-medium hover:bg-indigo-600":
                                      wh.id === user.currentWarehouse()?.id,
                                  },
                                )}
                              >
                                <Warehouse class="size-4" />
                                {wh.name}
                              </SidebarMenuButton>
                              <SidebarMenuSub class="pr-0 mr-0 pt-1">
                                <For each={wh.fcs}>
                                  {(fc) => (
                                    <SidebarMenuSubItem>
                                      <SidebarMenuSubButton
                                        onClick={() => {
                                          const cfc = user.currentFacility();
                                          if (cfc && cfc.id === fc.id) {
                                            toast.info("You are already on this facility");
                                            return;
                                          }
                                          if (isChangingFacility.pending) return;
                                          toast.promise(changeFacilityAction(wh.id, fc.id), {
                                            loading: "Changing facility...",
                                            success: "Facility changed",
                                            error: "Failed to change facility",
                                          });
                                        }}
                                        class={cn(
                                          "hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3 cursor-pointer",
                                          {
                                            "text-indigo-700 dark:text-foreground bg-indigo-600/10 font-medium hover:bg-indigo-600/20":
                                              fc.id === user.currentFacility()?.id,
                                          },
                                        )}
                                      >
                                        <Warehouse class="size-4" />
                                        {fc.name}
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  )}
                                </For>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton
                                    as={A}
                                    href={`/warehouse/${wh.id}/facility/new`}
                                    class={cn(
                                      "hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3 cursor-pointer",
                                    )}
                                  >
                                    <Plus class="size-4" />
                                    New Facility
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </SidebarMenuItem>
                          )}
                        </For>
                      </>
                    )}
                  </Show>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <Show when={user.currentFacility()}>
              {(fc) => (
                <SidebarGroup>
                  <SidebarGroupLabel>Facility: {fc().name}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Link href={`/warehouse/${user.currentWarehouse()?.id}/facility/${fc().id}/inventory`}>
                          <Package2 class="size-4" />
                          Inventory
                          <SidebarMenuBadge class="mr-1">
                            <div class="size-1 rounded-full bg-current"></div>
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href={`/warehouse/${user.currentWarehouse()?.id}/facility/${fc().id}/map`}>
                          <MapIcon class="size-4" />
                          Map
                          <SidebarMenuBadge class="mr-0.5">
                            <TriangleAlert class="size-4" />
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href={`/warehouse/${user.currentWarehouse()?.id}/facility/${fc().id}/devices`}>
                          <Cpu class="size-4" />
                          Devices
                          <SidebarMenuBadge
                            class={cn("mr-1", {
                              "text-indigo-600 dark:text-indigo-500":
                                relativePath() !==
                                `/warehouse/${user.currentWarehouse()?.id}/facility/${fc().id}/devices`,
                              "text-white":
                                relativePath() ===
                                `/warehouse/${user.currentWarehouse()?.id}/facility/${fc().id}/devices`,
                            })}
                          >
                            <div class="size-1 rounded-full outline outline-1 outline-current bg-current outline-offset-2 animate-ping"></div>
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </Show>
            <Show when={user.currentWarehouse()}>
              {(warehouse) => (
                <>
                  <SidebarGroup>
                    <SidebarGroupLabel>Orders, Sales & More</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href={`/warehouse/${user.currentWarehouse()?.id}/orders/customers`}>
                            <Tags class="size-4" />
                            Customer Orders
                            <SidebarMenuBadge class="mr-1">
                              {warehouse().orders.length > 99 ? "99+" : warehouse().orders.length}
                            </SidebarMenuBadge>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href={`/warehouse/${warehouse().id}/orders/suppliers`}>
                            <Tags class="size-4" />
                            Supply Orders
                            <SidebarMenuBadge class="mr-1">
                              {warehouse().orders.length > 99 ? "99+" : warehouse().orders.length}
                            </SidebarMenuBadge>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href={`/warehouse/${warehouse().id}/sales`}>
                            <BadgeEuro class="size-4" />
                            Sales
                            <SidebarMenuBadge class="mr-1">
                              {warehouse().sales.length > 99 ? "99+" : warehouse().sales.length}
                            </SidebarMenuBadge>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href={`/warehouse/${warehouse().id}/products`}>
                            <PackageSearch class="size-4" />
                            Products
                            <SidebarMenuBadge class="mr-1">
                              {warehouse().products.filter((p) => p.product.deletedAt === null).length}
                            </SidebarMenuBadge>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href={`/warehouse/${warehouse().id}/products/new`}>
                            <PackagePlus class="size-4" />
                            New Product
                          </Link>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  <Show when={user.currentOrganization()}>
                    {(org) => (
                      <SidebarGroup>
                        <SidebarGroupLabel>People & Papers</SidebarGroupLabel>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            <SidebarMenuItem>
                              <Link href={`/suppliers`}>
                                <Forklift class="size-4" />
                                Suppliers
                                <SidebarMenuBadge class="mr-1">
                                  {
                                    org()
                                      .suppliers.map((s) => s.supplier)
                                      .filter((c) => c.deletedAt === null).length
                                  }
                                </SidebarMenuBadge>
                              </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <Link href={`/customers`}>
                                <UsersRound class="size-4" />
                                Customers
                                <SidebarMenuBadge class="mr-1">
                                  {
                                    org()
                                      .customers.map((c) => c.customer)
                                      .filter((c) => c.deletedAt === null).length
                                  }
                                </SidebarMenuBadge>
                              </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <Link href={`/catalogs`}>
                                <BookOpenText class="size-4" />
                                Catalogs
                                <SidebarMenuBadge class="mr-1">
                                  {org().catalogs.filter((c) => c.deletedAt === null).length}
                                </SidebarMenuBadge>
                              </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <Link href={`/documents`}>
                                <Notebook class="size-4" />
                                Documents
                                <SidebarMenuBadge class="mr-1">
                                  {/* {org().documents.filter((c) => c.deletedAt === null).length} */}0
                                </SidebarMenuBadge>
                              </Link>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    )}
                  </Show>
                  <SidebarGroup>
                    <SidebarGroupLabel>Communication</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href={`/messages`}>
                            <MessageSquare class="size-4" />
                            Messages
                            <SidebarMenuBadge class="mr-1">0</SidebarMenuBadge>
                          </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <Link href={`/support`} disabled>
                            <Support class="size-4" />
                            Support
                          </Link>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}
            </Show>
          </SidebarContent>
        </Sidebar>
        <div class="w-full h-full flex flex-col overflow-auto">
          <Suspense
            fallback={
              <div class="w-full h-full flex items-center justify-center flex-col gap-2">
                <Loader2 class="size-4 animate-spin" />
                <span class="text-sm">Loading...</span>
              </div>
            }
          >
            {props.children}
          </Suspense>
        </div>
      </SidebarProvider>
    </div>
  );
}
