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
import { deleteProduct, getProductById, reAddProduct } from "@/lib/api/products";
import { InferQuery } from "@/lib/utils";
import { A, useAction, useSubmission } from "@solidjs/router";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";

type ProductMenuProps = { product: Accessor<InferQuery<typeof getProductById>> };

export const ProductMenu = (props: ProductMenuProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteProductAction = useAction(deleteProduct);
  const isDeletingProduct = useSubmission(deleteProduct);
  const reAddProductAction = useAction(reAddProduct);
  const isReAddingProduct = useSubmission(reAddProduct);
  return (
    <DropdownMenu placement="bottom-end">
      <DropdownMenuTrigger as={Button} variant="outline" size="sm" class="bg-background">
        <MoreHorizontal class="size-4" />
        Settings
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href={`./edit`}>
          <Edit class="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Show
          when={!props.product().isInSortiment}
          fallback={
            <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger
                as={DropdownMenuItem}
                class="!text-red-500 gap-2 cursor-pointer"
                closeOnSelect={false}
                onSelect={() => {
                  setTimeout(() => setDeleteDialogOpen(true), 10);
                }}
                disabled={props.product().deletedAt !== null}
              >
                <X class="size-4" />
                Remove from Sortiment
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure you want to delete this product?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the product and all its data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const promise = new Promise(async (resolve, reject) => {
                        const p = await deleteProductAction(props.product().id).catch(reject);
                        setDeleteDialogOpen(false);
                        return resolve(p);
                      });
                      toast.promise(promise, {
                        loading: "Deleting product...",
                        success: "Product deleted",
                        error: "Failed to delete product",
                      });
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        >
          <DropdownMenuItem
            class="cursor-pointer"
            onSelect={() => {
              toast.promise(reAddProductAction(props.product().id), {
                loading: "Adding product back to Sortiment...",
                success: "Product added back to Sortiment",
                error: "Failed to add product back to Sortiment",
              });
            }}
          >
            <Show when={isReAddingProduct.pending} fallback={<Plus class="size-4" />}>
              <Loader2 class="size-4 animate-spin" />
            </Show>
            Readd to Sortiment
          </DropdownMenuItem>
        </Show>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
