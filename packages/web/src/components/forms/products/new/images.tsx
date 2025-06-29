import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { A, revalidate } from "@solidjs/router";
import dayjs from "dayjs";
import Trash from "lucide-solid/icons/trash";
import UploadCloud from "lucide-solid/icons/upload-cloud";
import { createSignal, For, Show } from "solid-js"; // Added createSignal
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Images = () => {
  const { form } = useNewProductForm();
  const [uploadedFiles, setUploadedFiles] = createSignal<File[]>([]); // To store files selected by the user

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files); // This is just the *new* batch of files selected

      setUploadedFiles((prevFiles) => {
        // Create a new array for the combined, deduplicated files
        const combinedFiles: File[] = [...prevFiles];

        // For efficient lookup, create a Set of unique identifiers for existing files
        // A simple identifier can be a string like "name-size-lastModified"
        const existingFileIdentifiers = new Set(
          prevFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
        );

        for (const file of newFiles) {
          const fileIdentifier = `${file.name}-${file.size}-${file.lastModified}`;

          // Add the new file only if its identifier doesn't already exist in our set
          if (!existingFileIdentifiers.has(fileIdentifier)) {
            combinedFiles.push(file);
            existingFileIdentifiers.add(fileIdentifier); // Add new identifier to the set as well
          }
        }

        // Update the form field with the COMPLETE, deduplicated list of files
        // This is crucial for form submission
        form.setFieldValue("images", combinedFiles);

        return combinedFiles;
      });

      // Crucial: Reset the input's value to allow re-selecting the same file(s)
      // This makes the 'change' event fire again if the user picks the same files.
      // Without this, selecting the exact same file(s) again might not trigger the event.
      input.value = "";
    }
  };

  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Images</h2>
        <p class="text-muted-foreground text-sm">
          Upload images relevant to this product. You can upload multiple images.
        </p>
      </div>
      <div class="col-span-3 flex flex-col gap-4">
        <form.Field name="images" mode="array">
          {(imagesField) => (
            <div class="flex flex-col gap-4 w-full">
              <label
                for="file-upload"
                class="flex flex-col gap-2 items-center justify-center rounded-lg p-14 border-2 border-dashed cursor-pointer hover:bg-muted-foreground/[0.025]  transition-colors"
              >
                <UploadCloud class="size-8 text-muted-foreground" />
                <span class="text-muted-foreground text-sm">Drag and drop images here, or click to browse</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <Show when={uploadedFiles().length > 0}>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  <For each={uploadedFiles()}>
                    {(file, index) => {
                      const imageUrl = URL.createObjectURL(file);
                      return (
                        <div
                          class={cn(
                            "relative bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none overflow-clip w-full h-content",
                          )}
                        >
                          <div class="absolute top-2 right-2 gap-1 z-10 flex flex-row items-end justify-end w-full">
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                setUploadedFiles((old) => {
                                  const newArray = old.filter((f) => f !== file);
                                  return newArray;
                                });
                              }}
                            >
                              <Trash class="size-4" />
                            </Button>
                          </div>
                          <img src={imageUrl} alt={file.name} class="border-b w-full h-32 object-cover" />
                          <div class="flex flex-col gap-2 p-4 grow">
                            <div class="flex flex-col gap-1">
                              <span class="text-sm font-medium leading-none">{file.name}</span>
                              <span class="text-sm text-muted-foreground">
                                {file.type} - {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <div class="flex grow"></div>
                            <div class="flex flex-col gap-1">
                              <span class="text-xs text-muted-foreground">
                                Added: {dayjs().format("MMM DD, YYYY - h:mm A")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
};
