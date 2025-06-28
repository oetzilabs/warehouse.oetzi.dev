import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDevices, printProductSheet } from "@/lib/api/devices";
import { downloadProductSheet } from "@/lib/api/products";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import ArrowRight from "lucide-solid/icons/arrow-right";
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
      <DropdownMenu sameWidth>
        <DropdownMenuTrigger as={Button} class="w-full justify-between">
          <div class="flex items-center gap-2">
            <Printer class="size-4" />
            Print Product Sheet
          </div>
          <ArrowRight class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <Show when={printers()}>
            {(devices) => (
              <For each={devices()} fallback={<DropdownMenuItem disabled>No printers found</DropdownMenuItem>}>
                {(device) => (
                  <DropdownMenuItem
                    onClick={() => {
                      toast.promise(printProductSheetAction(device.id, props.product().id), {
                        loading: "Printing product sheet...",
                        success: "Product sheet printed",
                        error: "Failed to print product sheet",
                      });
                    }}
                  >
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
                  </DropdownMenuItem>
                )}
              </For>
            )}
          </Show>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu sameWidth>
        <DropdownMenuTrigger
          as={Button}
          variant="outline"
          class="w-full justify-between"
          disabled={isDownloadingProductSheet.pending}
        >
          <div class="flex items-center gap-2">
            <Show when={isDownloadingProductSheet.pending} fallback={<ArrowUpRight class="size-4" />}>
              <Loader2 class="size-4 animate-spin" />
            </Show>
            Download as PDF
          </div>
          <ArrowRight class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div class="flex items-center gap-2">A4</div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A4", type: "full" }), {
                      loading: "Downloading product sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Product sheet downloaded";
                      },
                      error: "Failed to download product sheet",
                    })
                  }
                >
                  Entire Sheet
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().stco.length === 0}
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A4", type: "conditions" }), {
                      loading: "Downloading conditions sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Conditions sheet downloaded";
                      },
                      error: "Failed to download conditions sheet",
                    })
                  }
                >
                  Conditions
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().labels.length === 0}
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A4", type: "labels" }), {
                      loading: "Downloading labels sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Labels sheet downloaded";
                      },
                      error: "Failed to download labels sheet",
                    })
                  }
                >
                  Labels
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().certs.length === 0}
                  onSelect={() =>
                    toast.promise(
                      downloadProductSheetAction(props.product().id, {
                        size: "A4",
                        type: "certifications",
                      }),
                      {
                        loading: "Downloading certifications sheet...",
                        success: (data) => {
                          triggerDownload(data.pdf, data.name);
                          return "Certifications sheet downloaded";
                        },
                        error: "Failed to download certifications sheet",
                      },
                    )
                  }
                >
                  Certifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A4", type: "map" }), {
                      loading: "Downloading map sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Map sheet downloaded";
                      },
                      error: "Failed to download map sheet",
                    })
                  }
                >
                  Map
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div class="flex items-center gap-2">A5</div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A5", type: "full" }), {
                      loading: "Downloading product sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Product sheet downloaded";
                      },
                      error: "Failed to download product sheet",
                    })
                  }
                >
                  Entire Sheet
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().stco.length === 0}
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A5", type: "conditions" }), {
                      loading: "Downloading conditions sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Conditions sheet downloaded";
                      },
                      error: "Failed to download conditions sheet",
                    })
                  }
                >
                  Conditions
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().labels.length === 0}
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A5", type: "labels" }), {
                      loading: "Downloading labels sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Labels sheet downloaded";
                      },
                      error: "Failed to download labels sheet",
                    })
                  }
                >
                  Labels
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={props.product().certs.length === 0}
                  onSelect={() =>
                    toast.promise(
                      downloadProductSheetAction(props.product().id, {
                        size: "A5",
                        type: "certifications",
                      }),
                      {
                        loading: "Downloading certifications sheet...",
                        success: (data) => {
                          triggerDownload(data.pdf, data.name);
                          return "Certifications sheet downloaded";
                        },
                        error: "Failed to download certifications sheet",
                      },
                    )
                  }
                >
                  Certifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toast.promise(downloadProductSheetAction(props.product().id, { size: "A5", type: "map" }), {
                      loading: "Downloading map sheet...",
                      success: (data) => {
                        triggerDownload(data.pdf, data.name);
                        return "Map sheet downloaded";
                      },
                      error: "Failed to download map sheet",
                    })
                  }
                >
                  Map
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
