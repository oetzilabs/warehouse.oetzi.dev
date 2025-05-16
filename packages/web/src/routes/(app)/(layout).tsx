import { SidebarContentProvider, useSidebarContent } from "@/components/providers/SidebarContentProvider";
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
import { changeWarehouse } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { A, useAction, useSubmission } from "@solidjs/router";
import { OrganizationInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import Warehouse from "lucide-solid/icons/warehouse";
import { JSXElement, Show } from "solid-js";
import { toast } from "solid-sonner";

const AppSidebar = () => {
  const user = useUser();
  const changeWarehouseAction = useAction(changeWarehouse);
  const isChangingWarehouse = useSubmission(changeWarehouse);
  return (
    <Sidebar>
      <SidebarHeader>
        <Show when={user.currentOrganization()}>
          {(org) => (
            <Select<OrganizationInfo["whs"][number]["warehouse"]>
              value={user.currentWarehouse()}
              onChange={(v) => {
                if (!v) return;
                toast.promise(changeWarehouseAction(v), {
                  loading: "Changing warehouse...",
                  success: "Warehouse changed",
                  error: "Failed to change warehouse",
                });
              }}
              options={org().whs.map((wh) => wh.warehouse) ?? []}
              placeholder="Select a warehouse…"
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  <Warehouse class="size-4" />
                  <span>{props.item.rawValue?.name}</span>
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as={A} href="/dashboard">
                  Home
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton as={A} href="/map">
                  Map
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
};

const RightSidebar = () => {
  const { content } = useSidebarContent();
  return (
    <Sidebar
      collapsible="none"
      side="right"
      class={cn("h-full", {
        "border-l w-96 h-full": content() !== null,
        "w-0 border-l-0": content() === null,
      })}
    >
      <SidebarContent>{content()}</SidebarContent>
    </Sidebar>
  );
};

export default function DashboardLayout(props: { children: JSXElement }) {
  return (
    <div class="w-full flex flex-col gap-0 grow">
      <div class="w-full flex flex-col grow">
        <SidebarContentProvider>
          <SidebarProvider>
            <AppSidebar />
            {props.children}
            <RightSidebar />
          </SidebarProvider>
        </SidebarContentProvider>
      </div>
    </div>
  );
}
