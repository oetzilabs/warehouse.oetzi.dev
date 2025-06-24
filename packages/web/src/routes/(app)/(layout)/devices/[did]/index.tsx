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
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { deleteDevice, getDeviceById } from "@/lib/api/devices";
import { testPrint } from "@/lib/api/printers";
import {
  A,
  createAsync,
  revalidate,
  RouteDefinition,
  useAction,
  useNavigate,
  useParams,
  useSubmission,
} from "@solidjs/router";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getDeviceById(props.params.did);
  },
} as RouteDefinition;

export default function DevicePage() {
  const params = useParams();
  const navigate = useNavigate();
  const device = createAsync(() => getDeviceById(params.did), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const deleteDeviceAction = useAction(deleteDevice);

  const testPrintAction = useAction(testPrint);
  const isTestPrinting = useSubmission(testPrint);

  return (
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
          <div class="container flex flex-col gap-4 py-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <Button variant="outline" size="sm" as={A} href="/devices" class="w-max">
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toast.promise(revalidate(getDeviceById.keyFor(deviceInfo().id)), {
                    loading: "Refreshing device...",
                    success: "Refreshed device",
                    error: "Failed to refresh device",
                  });
                }}
              >
                <RotateCw class="size-4" />
                Refresh
              </Button>
            </div>

            <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
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
            <div class="">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.promise(testPrintAction(), {
                    loading: "Printing...",
                    success: "Printed",
                    error: "Failed to print",
                  })
                }
              >
                Test Print
              </Button> */}
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
