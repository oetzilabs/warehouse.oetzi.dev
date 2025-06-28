import { Button } from "@/components/ui/button";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Edit from "lucide-solid/icons/edit";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show } from "solid-js";

type ProductImagesProps = {
  product: Accessor<ProductInfo>;
};

export const ProductImages = (props: ProductImagesProps) => {
  const [currentImage, setCurrentImage] = createSignal<number>(0);
  return (
    <div class="flex flex-col grow gap-4">
      <div class="flex flex-row items-center gap-4 justify-between">
        <h2 class="font-medium">Images</h2>
        <div class="flex flex-row items-center gap-2">
          <Button variant="outline" size="icon" class="bg-background">
            <Plus class="size-4" />
          </Button>
        </div>
      </div>
      <div class="flex flex-row items-center justify-center p-1 grow bg-muted-foreground/5 dark:bg-muted/30 rounded-lg border aspect-[4/3]">
        <Show
          when={props.product().images?.length > 0}
          fallback={<span class="text-sm text-muted-foreground">No images have been added yet</span>}
        >
          <div class="w-full grow flex flex-row gap-4 rounded-lg overflow-clip bg-gradient-to-b from-neutral-50 dark:from-neutral-900 to-transparent">
            <img
              src={props.product().images[currentImage()].image.url}
              alt={props.product().images[currentImage()].image.alt ?? "Product image"}
            />
          </div>
        </Show>
        <div class="w-max flex flex-col">
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
      </div>
    </div>
  );
};
