import { Button } from "@/components/ui/button";
import { getDevices, printProductSheet } from "@/lib/api/devices";
import { downloadProductSheet } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Printer from "lucide-solid/icons/printer";
import { Accessor, For, Show } from "solid-js";
import { toast } from "solid-sonner";

type ActionsProps = {
  product: Accessor<ProductInfo>;
};

export const Actions = (props: ActionsProps) => {
  const printers = createAsync(() => getDevices(), { deferStream: true });

  const printProductSheetAction = useAction(printProductSheet);
  const isPrintingProductSheet = useSubmission(printProductSheet);

  const downloadProductSheetAction = useAction(downloadProductSheet);
  const isDownloadingProductSheet = useSubmission(downloadProductSheet);

  const triggerDownload = (data: string, filename: string) => {
    const binaryString = atob(data);

    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Show when={printers() && (printers() ?? []).filter((d) => d.type.name.toLowerCase().includes("print"))}>
          {(devices) => (
            <For each={devices()} fallback={<Button disabled>No printers found</Button>}>
              {(device) => (
                <Button
                  class={cn("w-full flex justify-between items-center", {
                    "col-span-full": devices().length === 1,
                  })}
                  onClick={() => {
                    toast.promise(printProductSheetAction(device.id, props.product().id), {
                      loading: "Printing product sheet...",
                      success: "Product sheet printed",
                      error: "Failed to print product sheet",
                    });
                  }}
                  disabled={
                    isPrintingProductSheet.pending &&
                    isPrintingProductSheet.input[0] === device.id &&
                    isPrintingProductSheet.input[1] === props.product().id
                  }
                  variant="outline"
                >
                  <div class="flex items-center gap-2">
                    <Show
                      when={
                        isPrintingProductSheet.pending &&
                        isPrintingProductSheet.input[0] === device.id &&
                        isPrintingProductSheet.input[1] === props.product().id
                      }
                      fallback={<Printer class="size-4" />}
                    >
                      <Loader2 class="size-4 animate-spin" />
                    </Show>
                    {device.name.length > 0 ? device.name : device.type.name}
                  </div>
                  <span class="text-xs text-muted-foreground uppercase">{device.status}</span>
                </Button>
              )}
            </For>
          )}
        </Show>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Button
          class="w-full flex justify-between items-center"
          variant="default"
          disabled={
            isDownloadingProductSheet.pending &&
            isDownloadingProductSheet.input[0] === props.product().id &&
            isDownloadingProductSheet.input[1].size === "A4" &&
            isDownloadingProductSheet.input[1].type === "full"
          }
          onClick={() =>
            toast.promise(downloadProductSheetAction(props.product().id, { size: "A4", type: "full" }), {
              loading: "Downloading A4 product sheet...",
              success: (data) => {
                triggerDownload(data.pdf, data.name);
                return "A4 product sheet downloaded";
              },
              error: "Failed to download A4 product sheet",
            })
          }
        >
          <div class="flex items-center gap-2">
            <Show
              when={
                isDownloadingProductSheet.pending &&
                isDownloadingProductSheet.input[1].size === "A4" &&
                isDownloadingProductSheet.input[1].type === "full"
              }
              fallback={<ArrowUpRight class="size-4" />}
            >
              <Loader2 class="size-4 animate-spin" />
            </Show>
            Download A4 (Full)
          </div>
        </Button>
        <Button
          class="w-full flex justify-between items-center"
          variant="outline"
          disabled={
            isDownloadingProductSheet.pending &&
            isDownloadingProductSheet.input[1].size === "A5" &&
            isDownloadingProductSheet.input[1].type === "full"
          }
          onClick={() =>
            toast.promise(downloadProductSheetAction(props.product().id, { size: "A5", type: "full" }), {
              loading: "Downloading A5 product sheet...",
              success: (data) => {
                triggerDownload(data.pdf, data.name);
                return "A5 product sheet downloaded";
              },
              error: "Failed to download A5 product sheet",
            })
          }
        >
          <div class="flex items-center gap-2">
            <Show
              when={
                isDownloadingProductSheet.pending &&
                isDownloadingProductSheet.input[1].size === "A5" &&
                isDownloadingProductSheet.input[1].type === "full"
              }
              fallback={<ArrowUpRight class="size-4" />}
            >
              <Loader2 class="size-4 animate-spin" />
            </Show>
            Download A5 (Full)
          </div>
        </Button>
      </div>
    </div>
  );
};
