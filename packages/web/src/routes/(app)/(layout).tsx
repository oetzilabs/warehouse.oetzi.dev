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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { changeFacility } from "@/lib/api/facilities";
import { changeWarehouse } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { A, useAction, useLocation, useNavigate, useResolvedPath, useSubmission } from "@solidjs/router";
import BadgeEuro from "lucide-solid/icons/badge-euro";
import BookOpenText from "lucide-solid/icons/book-open-text";
import Cpu from "lucide-solid/icons/cpu";
import Forklift from "lucide-solid/icons/forklift";
import Support from "lucide-solid/icons/heart-plus";
import LayoutDashboard from "lucide-solid/icons/layout-dashboard";
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
    exact?: boolean;
  }>,
) => {
  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);
  return (
    <SidebarMenuButton
      class={cn("hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3 select-none", {
        "text-white bg-indigo-600 font-medium hover:bg-indigo-600":
          (relativePath() === props.href && props.exact) ||
          ((relativePath() ?? "").startsWith(props.href) && !props.exact),
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
  const navigate = useNavigate();

  return (
    <div class="w-full flex flex-col gap-0 h-full">
      <SidebarProvider>
        <Sidebar>
          <Show when={user.currentOrganization()}>
            {(org) => (
              <SidebarContent class="gap-0">
                <SidebarGroup>
                  <div class="w-full rounded-lg border px-3 py-2 text-sm cursor-pointer select-none flex flex-row items-center justify-between gap-4 text-muted-foreground hover:text-black dark:hover:text-white">
                    <span class="">Search</span>
                    <Search class="size-4" />
                  </div>
                </SidebarGroup>
                <SidebarGroup class="flex flex-col gap-0">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/dashboard">
                        <LayoutDashboard class="size-4" />
                        Dashboard
                      </Link>
                    </SidebarMenuItem>
                    {/* <SidebarSeparator /> */}
                    <SidebarMenuItem>
                      <Link href="/map">
                        <MapIcon class="size-4" />
                        Map
                        <SidebarMenuBadge class="mr-0.5">
                          <TriangleAlert class="size-4" />
                        </SidebarMenuBadge>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/devices">
                        <Cpu class="size-4" />
                        Devices
                        <SidebarMenuBadge
                          class={cn("mr-1", {
                            "text-indigo-600 dark:text-indigo-500": !(relativePath() ?? "").startsWith("/devices"),
                            "text-white": (relativePath() ?? "").startsWith("/devices"),
                          })}
                        >
                          <div class="size-1 rounded-full outline outline-1 outline-current bg-current outline-offset-2 animate-ping"></div>
                        </SidebarMenuBadge>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Orders, Sales & More</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Link href="/orders">
                          <Tags class="size-4" />
                          Customer Orders
                          <SidebarMenuBadge class="mr-1">
                            {org().customerOrders.length > 99 ? "99+" : org().customerOrders.length}
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/purchases">
                          <Tags class="size-4" />
                          Purchases
                          <SidebarMenuBadge class="mr-1">
                            {org().purchases.length > 99 ? "99+" : org().purchases.length}
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/sales">
                          <BadgeEuro class="size-4" />
                          Sales
                          <SidebarMenuBadge class="mr-1">
                            {org().sales.length > 99 ? "99+" : org().sales.length}
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/products">
                          <PackageSearch class="size-4" />
                          Products
                          <SidebarMenuBadge class="mr-1">
                            {org().products.filter((p) => p.product.deletedAt === null).length}
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
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
                                .supps.map((s) => s.supplier)
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
                        <Link href="/catalogs">
                          <BookOpenText class="size-4" />
                          Catalogs
                          <SidebarMenuBadge class="mr-1">
                            {org().catalogs.filter((c) => c.deletedAt === null).length}
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/documents">
                          <Notebook class="size-4" />
                          Documents
                          <SidebarMenuBadge class="mr-1">
                            {/* {org().documents.filter((c) => c.deletedAt === null).length} */}0
                          </SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/accounting">
                          <Notebook class="size-4" />
                          Accounting
                          <SidebarMenuBadge class="mr-1"></SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Communication</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Link href="/messages">
                          <MessageSquare class="size-4" />
                          Messages
                          <SidebarMenuBadge class="mr-1">0</SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/support" disabled>
                          <Support class="size-4" />
                          Support
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            )}
          </Show>
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
