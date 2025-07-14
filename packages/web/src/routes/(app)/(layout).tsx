import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { createQuery } from "@rocicorp/zero/solid";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { A, useLocation, useNavigate, useResolvedPath } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import BadgeEuro from "lucide-solid/icons/badge-euro";
import BookOpenText from "lucide-solid/icons/book-open-text";
import Coins from "lucide-solid/icons/coins";
import Cpu from "lucide-solid/icons/cpu";
import Forklift from "lucide-solid/icons/forklift";
import Support from "lucide-solid/icons/heart-plus";
import LayoutDashboard from "lucide-solid/icons/layout-dashboard";
import Loader2 from "lucide-solid/icons/loader-2";
import MessageSquare from "lucide-solid/icons/message-square";
import Notebook from "lucide-solid/icons/notebook";
import PackageOpen from "lucide-solid/icons/package-open";
import PackageSearch from "lucide-solid/icons/package-search";
import Search from "lucide-solid/icons/search";
import ShoppingCart from "lucide-solid/icons/shopping-cart";
import SidebarClose from "lucide-solid/icons/sidebar-close";
import SidebarOpen from "lucide-solid/icons/sidebar-open";
import Tags from "lucide-solid/icons/tags";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import UsersRound from "lucide-solid/icons/users-round";
import { createSignal, JSXElement, ParentProps, Show, Suspense } from "solid-js";

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

  // const z = user.z();

  // const [orgData] = createQuery(() => {
  //   const userId = user.user()?.id;
  //   const mainQuery = z!.query.TB_organizations.related("owner")
  //     .related("customerOrders")
  //     .related("purchases")
  //     .related("sales")
  //     .related("customers")
  //     .related("products");
  //   if (!userId) {
  //     return mainQuery.limit(0);
  //   }
  //   return mainQuery.limit(1).where("owner_id", "=", userId);
  // });

  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);
  const navigate = useNavigate();
  const [open, setOpen] = makePersisted(createSignal(true), {
    name: "sidebar-open",
    storage: cookieStorage,
  });

  return (
    <div class="w-full flex flex-col gap-0 h-full bg-muted dark:bg-[rgb(18,18,21)]">
      <SidebarProvider defaultOpen={open()} class="!border-r-0 dark:bg-[rgb(18,18,21)] !overflow-auto">
        <Sidebar class="bg-background !border-r-0 md:bg-transparent  dark:bg-[rgb(18,18,21)] !overflow-auto">
          <Show when={user.currentOrganization()}>
            {(org) => (
              <SidebarContent class="gap-0 !border-r-0 bg-background md:bg-transparent dark:bg-[rgb(18,18,21)] overflow-auto">
                <SidebarGroup class="md:!pr-0">
                  <div class="bg-background w-full rounded-lg border px-3 py-2 text-sm cursor-pointer select-none flex flex-row items-center justify-between gap-4 text-muted-foreground hover:text-black dark:hover:text-white">
                    <span class="">Search</span>
                    <Search class="size-4" />
                  </div>
                </SidebarGroup>
                <SidebarGroup class="flex flex-col gap-0 md:!pr-0">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/dashboard">
                        <LayoutDashboard class="size-4" />
                        Dashboard
                      </Link>
                    </SidebarMenuItem>
                    {/* <SidebarSeparator /> */}
                    <SidebarMenuItem>
                      <Link href="/stock">
                        <PackageOpen class="size-4" />
                        Stock
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
                <SidebarGroup class="md:!pr-0">
                  <SidebarGroupLabel>Orders, Sales & More</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <Link href="/orders">
                          <ShoppingCart class="size-4" />
                          Customer Orders
                          <SidebarMenuBadge class="mr-1">
                            {org().customerOrders.length > 99
                              ? "99+"
                              : org().customerOrders.filter((x) => x.deletedAt === null).length}
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
                <SidebarGroup class="md:!pr-0">
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
                          <Coins class="size-4" />
                          Accounting
                          <SidebarMenuBadge class="mr-1"></SidebarMenuBadge>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup class="md:!pr-0">
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
        <div class="w-full h-full flex flex-col p-2">
          <div class="relative w-full h-full flex flex-col overflow-auto border rounded-lg bg-background">
            <div class="w-full h-max flex p-2 bg-background gap-2 border-b">
              <SidebarButtonTrigger onToggle={setOpen} />
              <Show when={true}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    }
                  }}
                  class="px-2 md:px-3"
                >
                  <ArrowLeft class="size-4" />
                  <span class="sr-only md:not-sr-only">Back</span>
                </Button>
              </Show>
            </div>
            <div class="w-full grow flex flex-col overflow-auto">
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
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

const SidebarButtonTrigger = (props: { onToggle: (open: boolean) => void }) => {
  const { toggleSidebar, open } = useSidebar();
  return (
    <Button
      onClick={() => {
        toggleSidebar();
        props.onToggle(open());
      }}
      size="icon"
      variant="secondary"
    >
      <Show when={open()} fallback={<SidebarOpen class="size-4" />}>
        <SidebarClose class="size-4" />
      </Show>
    </Button>
  );
};
