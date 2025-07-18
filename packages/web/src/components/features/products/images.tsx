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
    <div class="group flex flex-col w-full h-content gap-4">
      <div class="flex flex-col p-1 w-full bg-muted rounded-lg border aspect-[4/3] gap-1">
        <div class="relative w-full h-full flex flex-row gap-4 rounded-md overflow-clip bg-gradient-to-b from-neutral-200 dark:from-neutral-900 to-transparent z-0">
          <Show
            when={props.product().images?.length > 0}
            fallback={
              <span class="text-sm text-muted-foreground w-full h-full flex items-center justify-center select-none">
                No images have been added yet
              </span>
            }
          >
            <img
              src={props.product().images[currentImage()].image.url}
              alt={props.product().images[currentImage()].image.alt ?? "Product image"}
            />
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-start justify-end gap-2 p-2">
              <Button size="icon" variant="destructive" class="size-6">
                <X class="!size-3" />
              </Button>
            </div>
          </Show>
        </div>
        <div class="flex flex-row border p-1 w-full rounded-md bg-background dark:bg-background/50 gap-2">
          <For each={props.product().images.map((pi) => pi.image)}>
            {(image) => (
              <div class="aspect-square size-10">
                <img src={image.url} alt={image.alt ?? "Product image"} class="w-full h-full object-cover rounded-sm" />
              </div>
            )}
          </For>
          <Button variant="secondary" size="icon" class="size-10 rounded-sm">
            <Plus class="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
