import { useUser } from "@/components/providers/User";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { changeFacility } from "@/lib/api/facilities";
import { changeWarehouse } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { A, useAction, useLocation, useResolvedPath, useSubmission } from "@solidjs/router";
import { OrganizationInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import Home from "lucide-solid/icons/home";
import MapIcon from "lucide-solid/icons/map";
import Plus from "lucide-solid/icons/plus";
import Search from "lucide-solid/icons/search";
import Warehouse from "lucide-solid/icons/warehouse";
import { For, JSXElement, ParentProps, Show } from "solid-js";
import { toast } from "solid-sonner";

const Link = (
  props: ParentProps<{
    href: string;
  }>,
) => {
  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);
  return (
    <SidebarMenuButton
      class={cn("hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3", {
        "text-white bg-indigo-600 font-medium hover:bg-indigo-600": relativePath() === props.href,
      })}
      as={A}
      href={props.href}
    >
      {props.children}
    </SidebarMenuButton>
  );
};

const AppSidebar = () => {
  const user = useUser();
  const changeWarehouseAction = useAction(changeWarehouse);
  const isChangingWarehouse = useSubmission(changeWarehouse);

  const changeFacilityAction = useAction(changeFacility);
  const isChangingFacility = useSubmission(changeFacility);

  const location = useLocation();
  const relativePath = useResolvedPath(() => location.pathname);

  return (
    <Sidebar>
      <SidebarHeader>
        <Show when={user.currentOrganization()}>
          {(org) => (
            <Select<OrganizationInfo["whs"][number]["warehouse"]>
              value={user.currentWarehouse()}
              onChange={(v) => {
                if (!v) return;
                toast.promise(changeWarehouseAction(v.id), {
                  loading: "Changing warehouse...",
                  success: "Warehouse changed",
                  error: "Failed to change warehouse",
                });
              }}
              disabled={isChangingWarehouse.pending}
              options={org().whs.map((wh) => wh.warehouse) ?? []}
              placeholder="Select a warehouse…"
              itemComponent={(props) => (
                <SelectItem item={props.item} class="cursor-pointer">
                  <div class="flex flex-row items-center gap-2 w-full">
                    <Warehouse class="size-4" />
                    <span>{props.item.rawValue?.name}</span>
                  </div>
                </SelectItem>
              )}
            >
              <SelectTrigger aria-label="Warehouse">
                <SelectValue<OrganizationInfo["whs"][number]["warehouse"] | null>>
                  {(state) => (
                    <div class="flex flex-row items-center gap-2">
                      <Warehouse class="size-4" />
                      <span class="text-sm font-medium">{state.selectedOption()?.name ?? "Select a warehouse…"}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          )}
        </Show>
      </SidebarHeader>
      <SidebarContent class="gap-0">
        <SidebarGroup class="py-0">
          <div class="w-full rounded-lg border px-3 py-2 text-sm cursor-pointer select-none flex flex-row items-center justify-between gap-4 text-muted-foreground hover:text-black dark:hover:text-white">
            <span class="">Search</span>
            <Search class="size-4" />
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Facilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Show when={user.currentWarehouse()}>
                {(wh) => (
                  <>
                    <For each={user.currentWarehouse()?.fcs}>
                      {(fc) => (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              const cfc = user.currentFacility();
                              if (cfc && cfc.id === fc.id) return;
                              toast.promise(changeFacilityAction(wh().id, fc.id), {
                                loading: "Changing facility...",
                                success: "Facility changed",
                                error: "Failed to change facility",
                              });
                            }}
                            class={cn("hover:bg-muted-foreground/10 rounded-lg px-3 py-2 h-auto gap-3", {
                              "text-white bg-indigo-600 font-medium hover:bg-indigo-600":
                                fc.id === user.currentFacility()?.id,
                            })}
                          >
                            <Warehouse class="size-4" />
                            {fc.name}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </For>
                    <SidebarMenuItem>
                      <Link href={`/warehouses/${wh().id}/facilities/new`}>
                        <Plus class="size-4" />
                        New Facility
                      </Link>
                    </SidebarMenuItem>
                  </>
                )}
              </Show>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Show when={user.currentFacility()}>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard">
                    <Home class="size-4" />
                    Home
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/map">
                    <MapIcon class="size-4" />
                    Map
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Show>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
};

export default function DashboardLayout(props: { children: JSXElement }) {
  return (
    <div class="w-full flex flex-col gap-0 grow">
      <div class="w-full flex flex-col grow">
        <SidebarProvider>
          <AppSidebar />
          {props.children}
        </SidebarProvider>
      </div>
    </div>
  );
}
