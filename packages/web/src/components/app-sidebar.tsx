import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { useColorMode } from "@kobalte/core";
import { A, createAsync } from "@solidjs/router";
import { type LucideProps } from "lucide-solid";
import Storage from "lucide-solid/icons/box";
import Home from "lucide-solid/icons/home";
import LogIn from "lucide-solid/icons/log-in";
import Moon from "lucide-solid/icons/moon";
import Plus from "lucide-solid/icons/plus";
import Settings from "lucide-solid/icons/settings";
import Building from "lucide-solid/icons/store";
import Sun from "lucide-solid/icons/sun";
import Warehouse from "lucide-solid/icons/warehouse";
import { For, JSXElement, Match, Show, Suspense, Switch } from "solid-js";

type MenuData = {
  title: string;
  url: string;
  icon: (props: LucideProps) => JSXElement;
  subItems: MenuData[];
};

export function AppSidebar() {
  const user = createAsync(() => getAuthenticatedUser(), { deferStream: true });
  const { colorMode, toggleColorMode } = useColorMode();

  const topItems = (u: ReturnType<typeof user>): MenuData[] =>
    typeof u === "undefined"
      ? [
          {
            title: "Login",
            url: "/login",
            icon: LogIn,
            subItems: [],
          },
        ]
      : u.organizations.length > 0
        ? u.organizations
            .map((org) => ({
              title: org.org.name,
              url: `/organizations/${org.org.slug}`,
              icon: Building,
              subItems: org.org.warehouses
                .map((whs) => whs.warehouse)
                .map((wh) => ({
                  title: wh.name,
                  url: `/warehouses/${wh.id}`,
                  icon: Warehouse,
                  subItems: [
                    {
                      title: "Storages",
                      url: `/warehouses/${wh.id}/storages`,
                      icon: Storage,
                      subItems: [] as MenuData[],
                    },
                  ],
                }))
                .flat(),
            }))
            .flat()
        : [
            {
              title: "Create Organization",
              url: "/organizations/new",
              icon: Plus,
              subItems: [] as MenuData[],
            },
          ];

  const bottomItems = [
    {
      title: "Settings",
      url: "settings",
      icon: Settings,
    },
  ];
  return (
    <Sidebar variant="floating" class="!pr-0">
      <SidebarHeader>
        <A href="/" class="w-full flex flex-col items-center justify-center ">
          <div class="flex flex-row items-center gap-2 w-full bg-teal-500 px-4 py-1 rounded-md justify-center text-white">
            <span class="text-xl font-bold">WareHouse.</span>
          </div>
        </A>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as={A} href="/dashboard">
                  <Home />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Suspense fallback={<div>Loading...</div>}>
                <Show
                  when={user() && user()}
                  fallback={
                    <SidebarMenuItem>
                      <SidebarMenuButton as={A} href="/login">
                        <LogIn />
                        <span>Login</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  }
                >
                  {(u) => (
                    <For each={topItems(u())} fallback={<div class="">No items</div>}>
                      {(item) =>
                        item.subItems.length > 0 ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuButton as={A} href={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                            <SidebarMenuSubButton>
                              <For each={item.subItems}>
                                {(subItem) => (
                                  <SidebarMenuSubItem>
                                    <SidebarMenuButton as={A} href={subItem.url}>
                                      <subItem.icon />
                                      <span>{subItem.title}</span>
                                    </SidebarMenuButton>
                                  </SidebarMenuSubItem>
                                )}
                              </For>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ) : (
                          <SidebarMenuItem>
                            <SidebarMenuButton as={A} href={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      }
                    </For>
                  )}
                </Show>
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div class="flex flex-col grow"></div>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <For each={bottomItems}>
              {(item) => (
                <SidebarMenuItem>
                  <SidebarMenuButton as={A} href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </For>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => toggleColorMode()}>
                <Switch>
                  <Match when={colorMode() === "light"}>
                    {/* <Sun class="size-3.5" /> */}
                    Bright
                  </Match>
                  <Match when={colorMode() === "dark"}>
                    {/* <Moon class="size-3.5" /> */}
                    Dark
                  </Match>
                </Switch>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
