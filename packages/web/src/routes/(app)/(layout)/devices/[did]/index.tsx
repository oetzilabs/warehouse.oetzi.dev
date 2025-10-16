import { DeviceActions } from "@/components/devices/actions";
import { DeviceHistory } from "@/components/devices/history";
import { DeviceLogs } from "@/components/devices/logs";
import { DeviceSettings } from "@/components/devices/settings";
import { DeviceTerminal } from "@/components/devices/terminal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { deleteDevice, getDeviceById } from "@/lib/api/devices";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSearchParams } from "@solidjs/router";
import dayjs from "dayjs";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import LogIcon from "lucide-solid/icons/scroll-text";
import SettingsIcon from "lucide-solid/icons/settings";
import TerminalIcon from "lucide-solid/icons/terminal";
import HistoryIcon from "lucide-solid/icons/timer";
import X from "lucide-solid/icons/x";
import Zap from "lucide-solid/icons/zap";
import { createMemo, createSignal, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const session = await getSessionToken();
    const device = await getDeviceById(props.params.did);
    return { user, session, device };
  },
} as RouteDefinition;

export default function DevicePage() {
  const params = useParams();
  const navigate = useNavigate();
  const device = createAsync(() => getDeviceById(params.did), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const deleteDeviceAction = useAction(deleteDevice);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = createMemo(() => (searchParams.tab as string | undefined) ?? "history");

  return (
    <div class="flex flex-row w-full grow p-4 gap-2 grow">
      <Suspense
        fallback={
          <div class="w-full h-full flex items-center justify-center flex-col gap-2">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={device()}>
          {(deviceInfo) => (
            <div class="flex flex-col w-full grow gap-4">
              <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground w-full h-max">
                <div class="flex flex-row items-center gap-2 justify-between">
                  <div class="flex flex-row items-baseline gap-2">
                    <h2 class="text-2xl font-bold tracking-wide uppercase">{deviceInfo().name}</h2>
                    <Show when={deviceInfo().deletedAt}>
                      <span class="text-sm font-semibold text-red-500">Deleted</span>
                    </Show>
                  </div>
                  <DropdownMenu placement="bottom-end">
                    <DropdownMenuTrigger as={Button} variant="outline" size="icon" class="bg-background size-6">
                      <MoreHorizontal class="size-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href={`./edit`}>
                        <Edit class="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger
                          as={DropdownMenuItem}
                          class="!text-red-500 gap-2 cursor-pointer"
                          closeOnSelect={false}
                          onSelect={() => {
                            setTimeout(() => setDeleteDialogOpen(true), 10);
                          }}
                        >
                          <X class="size-4" />
                          Delete
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure you want to delete this device?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete the device.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const promise = new Promise(async (resolve, reject) => {
                                  const p = await deleteDeviceAction(deviceInfo().id).catch(reject);
                                  setDeleteDialogOpen(false);
                                  navigate("/devices");
                                  return resolve(p);
                                });
                                toast.promise(promise, {
                                  loading: "Deleting device...",
                                  success: "Device deleted",
                                  error: "Failed to delete device",
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                    Description: {deviceInfo().description ?? "N/A"}
                  </span>
                  <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                    Type: {deviceInfo().type.name}
                  </span>
                  <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                    Status: {deviceInfo().status}
                  </span>
                  <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                    Last Updated:{" "}
                    {dayjs(deviceInfo().updatedAt ?? deviceInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                  </span>
                </div>
              </div>
              <div class="w-full flex-col flex gap-2 grow">
                <Tabs
                  defaultValue="history"
                  class="flex flex-col w-full grow"
                  value={currentTab()}
                  onChange={(v) => setSearchParams({ tab: v })}
                >
                  <TabsList class="w-full flex flex-row items-center justify-start">
                    <TabsTrigger
                      value="history"
                      class="flex flex-row items-center gap-2"
                      disabled={!deviceInfo().tabs.history}
                    >
                      <HistoryIcon class="size-4" />
                      History
                    </TabsTrigger>
                    <TabsTrigger
                      value="actions"
                      class="flex flex-row items-center gap-2"
                      disabled={!deviceInfo().tabs.actions}
                    >
                      <Zap class="size-4" />
                      Actions
                    </TabsTrigger>
                    <TabsTrigger
                      value="logs"
                      class="flex flex-row items-center gap-2"
                      disabled={!deviceInfo().tabs.logs}
                    >
                      <LogIcon class="size-4" />
                      Logs
                    </TabsTrigger>
                    <TabsTrigger
                      value="terminal"
                      class="flex flex-row items-center gap-2"
                      disabled={!deviceInfo().tabs.terminal}
                    >
                      <TerminalIcon class="size-4" />
                      Terminal
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      class="flex flex-row items-center gap-2"
                      disabled={!deviceInfo().tabs.settings}
                    >
                      <SettingsIcon class="size-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="history"
                    class="w-full mt-4 flex flex-col gap-2 grow border rounded-lg bg-muted-foreground/[0.1] dark:bg-muted/10 overflow-clip p-4"
                  >
                    <DeviceHistory deviceId={deviceInfo().id} />
                  </TabsContent>
                  <TabsContent
                    value="actions"
                    class="w-full mt-4 flex flex-col gap-2 grow border rounded-lg bg-muted-foreground/[0.1] dark:bg-muted/10 overflow-clip p-4"
                  >
                    <DeviceActions deviceId={deviceInfo().id} />
                  </TabsContent>
                  <TabsContent
                    value="logs"
                    class="w-full mt-4 flex flex-col gap-2 grow border rounded-lg bg-muted-foreground/[0.1] dark:bg-muted/10 overflow-clip p-4"
                  >
                    <DeviceLogs deviceId={deviceInfo().id} />
                  </TabsContent>
                  <TabsContent
                    value="settings"
                    class="w-full mt-4 flex flex-col gap-2 grow border rounded-lg bg-muted-foreground/[0.1] dark:bg-muted/10 overflow-clip p-4"
                  >
                    <DeviceSettings deviceId={deviceInfo().id} />
                  </TabsContent>
                  <TabsContent
                    value="terminal"
                    class="w-full mt-4 flex flex-col gap-2 grow border rounded-lg bg-muted-foreground/[0.1] dark:bg-black overflow-clip p-4"
                  >
                    <DeviceTerminal deviceId={deviceInfo().id} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
