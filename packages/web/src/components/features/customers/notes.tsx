import { PreferredTimeDialog } from "@/components/customers/preferred-time-dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import {
  addPreferredDeliveryTime,
  addPreferredPickupTime,
  deleteCustomer,
  getCustomerById,
  removePreferredDeliveryTime,
  removePreferredPickupTime,
} from "@/lib/api/customers";
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
import { CustomerInfo } from "@warehouseoetzidev/core/src/entities/customers";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Database from "lucide-solid/icons/database";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import ScanBarcode from "lucide-solid/icons/scan-barcode";
import Trash from "lucide-solid/icons/trash";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type NotesProps = {
  customer: Accessor<CustomerInfo>;
};

export const Notes = (props: NotesProps) => {
  return (
    <div class="flex flex-col border rounded-lg">
      <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b bg-muted-foreground/5 dark:bg-muted/30">
        <h2 class="font-medium">Notes</h2>
        <div class="flex flex-row items-center">
          <Button size="sm">
            <Plus class="size-4" />
            Add Note
          </Button>
        </div>
      </div>
      <div class="flex flex-col w-full">
        <Show when={props.customer().notes.length === 0}>
          <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full">
            <span class="text-sm text-muted-foreground">No notes have been added</span>
            <div class="flex flex-row gap-2 items-center justify-center">
              <Button size="sm">
                <Plus class="size-4" />
                Add Note
              </Button>
            </div>
          </div>
        </Show>
        <Show when={props.customer().notes.length > 0}>
          <div class="flex flex-col gap-1">
            <For each={props.customer().notes}>
              {(note) => (
                <div class="flex flex-col gap-2 p-4 border-b last:border-b-0">
                  <div class="flex flex-col gap-3">
                    <div class="flex flex-row items-center gap-1 justify-between">
                      <span class="font-semibold">{note.title}</span>
                      <div class="flex flex-row items-center gap-2 w-max">
                        <Button size="icon" variant="outline" class="bg-background size-6">
                          <Edit class="size-3" />
                        </Button>
                        <Button size="icon" variant="outline" class="bg-background size-6">
                          <X class="size-3" />
                        </Button>
                      </div>
                    </div>
                    <span class="text-sm text-muted-foreground">{note.content}</span>
                  </div>
                  <span class="text-sm text-muted-foreground">{dayjs(note.createdAt).fromNow()}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
