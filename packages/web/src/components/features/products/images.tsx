import { Button } from "@/components/ui/button";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Edit from "lucide-solid/icons/edit";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, For, Show } from "solid-js";

type ProductImagesProps = {
  product: Accessor<ProductInfo>;
};

export const ProductImages = (props: ProductImagesProps) => {
  return (
    <div class="flex flex-col border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
        <h2 class="font-medium">Images</h2>
        <div class="flex flex-row items-center gap-2">
          <Button variant="outline" size="sm" class="bg-background">
            <Plus class="size-4" />
            Add Images
          </Button>
        </div>
      </div>
      <Show
        when={props.product().images?.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center p-8">
            <span class="text-sm text-muted-foreground">No images have been added yet</span>
          </div>
        }
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <For each={props.product().images.map((pi) => pi.image)}>
            {(image) => (
              <div class="relative aspect-square group">
                <img src={image.url} alt={image.alt ?? "Product image"} class="w-full h-full object-cover rounded-lg" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary">
                    <Edit class="size-4" />
                  </Button>
                  <Button size="icon" variant="destructive">
                    <X class="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
