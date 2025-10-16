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
import { deleteDevice, getDeviceActions, sendDeviceAction } from "@/lib/api/devices";
import { A, createAsync, revalidate, useAction, useNavigate, useSubmission } from "@solidjs/router";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import RefreshIcon from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export type DeviceActionsProps = {
  deviceId: string;
};

export function DeviceActions(props: DeviceActionsProps) {
  const deviceActions = createAsync(() => getDeviceActions(props.deviceId), { deferStream: true });
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteDeviceAction = useAction(deleteDevice);

  const sendAction = useAction(sendDeviceAction);
  const isSendingAction = useSubmission(sendDeviceAction);

  return (
    <div class="flex flex-col gap-4 grow">
      <Suspense
        fallback={
          <div class="w-full h-full flex items-center justify-center flex-row gap-4 py-10 text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={deviceActions()}>
          {(actions) => (
            <div class="flex flex-col items-center justify-center flex-1 w-full py-10 ">
              <div class="flex flex-col items-center justify-center h-max w-full gap-4">
                <For
                  each={actions()}
                  fallback={
                    <div class="flex flex-col items-center justify-center h-full w-full py-10 gap-4">
                      <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        <span>There are currently no actions for this device available.</span>
                      </div>
                      <div class="w-full h-full flex items-center justify-center gap-2">
                        <Button size="sm">
                          <Plus class="size-4" />
                          <span class="sr-only md:not-sr-only">Add Action</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            toast.promise(revalidate([getDeviceActions.key]), {
                              loading: "Refreshing actions...",
                              success: "Actions refreshed",
                              error: "Failed to refresh actions",
                            });
                          }}
                        >
                          <RefreshIcon class="size-4" />
                          <span class="sr-only md:not-sr-only">Refresh</span>
                        </Button>
                      </div>
                    </div>
                  }
                >
                  {(action) => (
                    <div class="flex flex-row items-center gap-2 justify-between">
                      <div class="flex flex-row items-baseline gap-2">
                        <h2 class="text-2xl font-bold tracking-wide uppercase">{action.name}</h2>
                        <Show when={action.deletedAt}>
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
                                      const p = await deleteDeviceAction(props.deviceId).catch(reject);
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
                  )}
                </For>
              </div>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
