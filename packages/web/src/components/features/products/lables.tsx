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
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { addLabelsToProduct, getProductLabels, removeLabelsFromProduct } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type LabelsProps = {
  product: Accessor<ProductInfo>;
};

export const Labels = (props: LabelsProps) => {
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const [addLabelDialogOpen, setAddLabelDialogOpen] = createSignal(false);

  const [selectedLabels, setSelectedLabels] = createSignal<string[]>([]);
  const [deleteLabelDialogOpen, setDeleteLabelDialogOpen] = createSignal<{
    isOpen: boolean;
    labelId: string | null;
    labelName: string | null;
  }>({
    isOpen: false,
    labelId: null,
    labelName: null,
  });
  const addLabelsToProductAction = useAction(addLabelsToProduct);
  const isAddingLabelsToProduct = useSubmission(addLabelsToProduct);

  const removeLabelsFromProductAction = useAction(removeLabelsFromProduct);
  const isRemovingLabelsFromProduct = useSubmission(removeLabelsFromProduct);
  return (
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-row items-center gap-4 justify-between">
        <div class="flex flex-row items-center gap-2 justify-end w-full">
          <Dialog open={addLabelDialogOpen()} onOpenChange={setAddLabelDialogOpen}>
            <DialogTrigger as={Button} variant="outline" size="sm" class="bg-background">
              <Plus class="size-4" />
              Add Label{selectedLabels().length > 0 && ` (${selectedLabels().length})`}
            </DialogTrigger>
            <DialogContent class="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Add Label</DialogTitle>
                <DialogDescription>Select labels to add to this product</DialogDescription>
              </DialogHeader>
              <div class="flex flex-col gap-4 py-2 pb-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <Suspense
                    fallback={
                      <div class="flex items-center justify-center py-4">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    }
                  >
                    <Show
                      when={labels()}
                      fallback={
                        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                          There are no labels available.
                        </div>
                      }
                    >
                      {(labelsList) => {
                        setSelectedLabels(props.product().labels.map((l) => l.label.id));
                        return (
                          <For
                            each={labelsList().sort((a, b) => {
                              const aHasImage = a.image?.length ?? 0;
                              const bHasImage = b.image?.length ?? 0;
                              const aIsNewer = (a.updatedAt ?? a.createdAt) > (b.updatedAt ?? b.createdAt);
                              return aHasImage > bHasImage ? -1 : aHasImage < bHasImage ? 1 : aIsNewer ? -1 : 1;
                            })}
                          >
                            {(label) => (
                              <div
                                class={cn(
                                  "bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer overflow-clip w-full h-content",
                                  {
                                    "!text-white bg-indigo-600 hover:bg-indigo-600": selectedLabels().includes(
                                      label.id,
                                    ),
                                  },
                                )}
                                onClick={() => {
                                  setSelectedLabels((prev) => {
                                    if (prev.includes(label.id)) {
                                      return prev.filter((id) => id !== label.id);
                                    }
                                    return [...prev, label.id];
                                  });
                                }}
                              >
                                <Show
                                  when={(label.image?.length ?? 0) > 0 && label.image}
                                  fallback={<div class="bg-muted-foreground w-full h-32" />}
                                >
                                  {(i) => <img src={i()} class="border-b w-full h-32 object-cover" />}
                                </Show>
                                <div class="flex flex-col gap-2 p-4 pt-2 grow">
                                  <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium leading-none">{label.name}</span>
                                    <span
                                      class={cn("text-sm text-muted-foreground", {
                                        "text-white/70": selectedLabels().includes(label.id),
                                      })}
                                    >
                                      {label.description ?? "No description available"}
                                    </span>
                                  </div>
                                  <div class="flex grow" />
                                  <div class="flex flex-col gap-1">
                                    <span
                                      class={cn("text-xs text-muted-foreground", {
                                        "text-white/70": selectedLabels().includes(label.id),
                                      })}
                                    >
                                      {dayjs(label.updatedAt ?? label.createdAt).format("MMM DD, YYYY - h:mm A")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </For>
                        );
                      }}
                    </Show>
                  </Suspense>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLabels([]);
                    setAddLabelDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={selectedLabels().length === 0 || isAddingLabelsToProduct.pending}
                  onClick={() => {
                    toast.promise(addLabelsToProductAction(props.product().id, selectedLabels()), {
                      loading: "Adding labels...",
                      success: () => {
                        setSelectedLabels([]);
                        setAddLabelDialogOpen(false);
                        return "Labels added";
                      },
                      error: "Failed to add labels",
                    });
                  }}
                >
                  Add Selected ({selectedLabels().length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div class="flex flex-col rounded-lg border">
        <For
          each={props.product().labels}
          fallback={
            <div class="flex flex-col items-center justify-center p-8 bg-muted-foreground/5 dark:bg-muted/30">
              <span class="text-sm text-muted-foreground">No labels added.</span>
            </div>
          }
        >
          {(label) => (
            <div class="flex flex-row gap-2 p-4 items-center border-b last:border-b-0 justify-between">
              <div class="flex flex-row items-center gap-2">
                <Show when={label.label.image && label.label.image.length > 0 && label.label.image}>
                  {(src) => <img src={src()} alt={label.label.name} class="size-16 object-cover rounded-md" />}
                </Show>
                <div class="flex flex-col gap-1">
                  <span class="text-sm ">{label.label.name ?? "N/A"}</span>
                  <span class="text-xs text-muted-foreground">{label.label.description ?? "N/A"}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 h-full">
                <Dialog
                  open={deleteLabelDialogOpen().isOpen && deleteLabelDialogOpen().labelId === label.label.id}
                  onOpenChange={(open) =>
                    setDeleteLabelDialogOpen({
                      isOpen: open,
                      labelId: open ? label.label.id : null,
                      labelName: open ? label.label.name : null,
                    })
                  }
                >
                  <DialogTrigger as={Button} variant="outline" class="bg-background size-6" size="icon">
                    <X class="!size-3" />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Label</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove the label "{deleteLabelDialogOpen().labelName}" from this
                        product?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteLabelDialogOpen({ isOpen: false, labelId: null, labelName: null });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={isRemovingLabelsFromProduct.pending}
                        onClick={() => {
                          toast.promise(
                            removeLabelsFromProductAction(props.product().id, label.label.id).then(() => {
                              setDeleteLabelDialogOpen({ isOpen: false, labelId: null, labelName: null });
                            }),
                            {
                              loading: "Removing label...",
                              success: "Label removed",
                              error: "Failed to remove label",
                            },
                          );
                        }}
                      >
                        <Show when={isRemovingLabelsFromProduct.pending} fallback={<X class="size-4" />}>
                          <Loader2 class="size-4 animate-spin" />
                        </Show>
                        Remove
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
