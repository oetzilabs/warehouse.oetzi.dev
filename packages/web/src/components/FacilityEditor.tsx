import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type FacilityInfo } from "@warehouseoetzidev/core/src/entities/facilities";
import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash-2";
import { Accessor, createEffect, createSignal, For, Show } from "solid-js";

const areaBoundingBox = (area: FacilityInfo["ars"][number]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  area.strs.forEach((storage) => {
    minX = Math.min(minX, storage.bounding_box.x);
    minY = Math.min(minY, storage.bounding_box.y);
    maxX = Math.max(maxX, storage.bounding_box.x + storage.bounding_box.width);
    maxY = Math.max(maxY, storage.bounding_box.y + (storage.bounding_box.length ?? storage.bounding_box.height));
  });

  const width = maxX - minX === -Infinity ? 0 : maxX - minX;
  const height = maxY - minY === -Infinity ? 0 : maxY - minY;

  return { x: minX === Infinity ? 0 : minX, y: minY === Infinity ? 0 : minY, width, height };
};

const FacilityEditor = (props: { facility: Accessor<FacilityInfo>; editing: Accessor<boolean> }) => {
  const padding = 20;

  return (
    <div class="p-2 flex flex-row gap-4">
      <For each={props.facility().ars}>
        {(area) => (
          <div
            class="outline-1 outline-neutral-300 dark:outline-neutral-700 outline-dashed group relative"
            style={{
              width: `${areaBoundingBox(area).width + 2 * padding}px`,
              height: `${areaBoundingBox(area).height + 2 * padding}px`,
            }}
          >
            <For each={area.strs}>
              {(storage) => (
                <div
                  class={cn("absolute border border-neutral-400 dark:border-neutral-500 bg-muted group/storage flex", {
                    "flex-row": storage.variant === "vertical",
                    "flex-col": storage.variant === "horizontal",
                  })}
                  style={{
                    top: `${storage.bounding_box.y + padding}px`,
                    left: `${storage.bounding_box.x + padding}px`,
                    width: `${storage.bounding_box.width}px`,
                    height: `${storage.bounding_box.length ?? storage.bounding_box.height}px`,
                  }}
                >
                  <Show when={props.editing()}>
                    <div class="absolute -top-6 left-0">
                      <span class="text-xs text-muted-foreground">{storage.name}</span>
                    </div>
                    <div class="absolute -right-8 top-0 flex flex-col gap-1">
                      <Button size="icon" class="size-6">
                        <Plus class="size-3" />
                      </Button>
                      <Button size="icon" class="size-6" variant="destructive">
                        <Trash2 class="size-3 text-white" />
                      </Button>
                    </div>
                  </Show>

                  <For each={storage.invs}>
                    {(inventory) => (
                      <div
                        class={cn(
                          "hover:bg-teal-200 dark:hover:bg-teal-600 active:bg-teal-300 dark:active:bg-teal-500 group/inv relative cursor-pointer",
                          {
                            "border-neutral-400 dark:border-neutral-500 border-r last:border-r-0":
                              storage.variant === "vertical",
                            "border-neutral-400 dark:border-neutral-500 border-b last:border-b-0":
                              storage.variant === "horizontal",
                          },
                        )}
                        style={
                          storage.variant === "horizontal"
                            ? {
                                width: "100%",
                                height: `calc(100%/${storage.invs.length})`,
                              }
                            : {
                                width: `${storage.bounding_box.width / storage.invs.length}px`,
                                height: "100%",
                              }
                        }
                      >
                        <Show when={props.editing()}>
                          <Button
                            size="icon"
                            variant="destructive"
                            class="absolute -top-2 -right-2 size-6 opacity-0 group-hover/inv:opacity-100"
                          >
                            <Trash2 class="size-2 text-white" />
                          </Button>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};

export default FacilityEditor;
