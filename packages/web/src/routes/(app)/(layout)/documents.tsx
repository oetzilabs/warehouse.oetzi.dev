import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDocuments } from "@/lib/api/documents";
import { cn, type Paths } from "@/lib/utils";
import { createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { DocumentInfo } from "@warehouseoetzidev/core/src/entities/documents";
import FileSearch from "lucide-solid/icons/file-search";
import RectangleHorizontal from "lucide-solid/icons/rectangle-horizontal";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import X from "lucide-solid/icons/x";
import { Accessor, createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getDocuments();
  },
} as RouteDefinition;

export default function DocumentsPage() {
  const documents = createAsync(() => getDocuments(), { deferStream: true });
  const [selectedDocument, setSelectedDocument] = createSignal<DocumentInfo | null>(null);
  const [previewVisible, setPreviewVisible] = createSignal(false);

  return (
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={documents()}>
        {(ds) => (
          <div class="container flex flex-col grow py-4">
            <div class="w-full flex flex-row h-full border rounded-xl">
              <div class="w-full flex flex-col gap-4">
                <div class="flex items-center gap-4 justify-between w-full border-b p-4 ">
                  <h1 class="font-semibold leading-none">Documents</h1>
                  <div class="flex items-center gap-0">
                    <Button
                      size="icon"
                      variant="outline"
                      class="w-9 h-8 rounded-r-none bg-background"
                      onClick={() => {
                        toast.promise(revalidate(getDocuments.key), {
                          loading: "Refreshing documents...",
                          success: "Documents refreshed",
                          error: "Failed to refresh documents",
                        });
                      }}
                    >
                      <RotateCw class="size-4" />
                    </Button>
                    <Button size="sm" class="h-8 pl-2.5 rounded-l-none">
                      <Upload class="size-4" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div class="flex flex-col gap-2 w-full grow px-4">
                  <DocumentList
                    documents={ds}
                    searchBy={["path", "type"]}
                    setSelectedDocument={(doc) => {
                      setSelectedDocument(doc);
                      setPreviewVisible(true);
                    }}
                  />
                </div>
              </div>
              <div
                class={cn("w-full lg:max-w-lg border-l lg:flex hidden flex-col grow", {
                  "!hidden": !previewVisible(),
                })}
              >
                <div class="w-full flex flex-row gap-4 items-center justify-between border-b p-4">
                  <h2 class="font-semibold leading-none">Preview Document</h2>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="size-8"
                    onClick={() => {
                      setPreviewVisible(false);
                    }}
                  >
                    <X class="size-4" />
                  </Button>
                </div>
                <Show
                  when={selectedDocument()}
                  fallback={
                    <div class="p-4 w-full grow flex flex-col">
                      <div class="flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border text-muted-foreground">
                        <FileSearch class="size-10 text-muted-foreground/50" stroke-width={1} />
                        <span class="text-sm">No document selected</span>
                      </div>
                    </div>
                  }
                >
                  {(p) => <div class="p-4 w-full flex flex-col gap-4"></div>}
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}

const DocumentList = (props: {
  documents: Accessor<DocumentInfo[]>;
  searchBy: Paths<DocumentInfo>[];
  setSelectedDocument: (doc: DocumentInfo | null) => void;
}) => {
  const [search, setSearch] = createSignal("");
  const [tags, setTags] = createSignal<string[]>([]);

  const filterDocuments = createMemo(() => {
    const ds = props.documents();
    if (search() === "") return ds;

    // deep search by searchBy (dot notation path)
    const searchBy = search().split(".");
    const get = (obj: any, path: string[]) => {
      if (path.length === 0) return obj;
      return get(obj[path[0]], path.slice(1));
    };
    const resultBySearch = ds.filter((d) => {
      const value = get(d, searchBy);
      if (typeof value === "string") {
        return value.toLowerCase().includes(search().toLowerCase());
      }
      return false;
    });
    const resultByTags = resultBySearch;
    // .filter((d) => {
    //   return tags().every((t) => d.tags.includes(t));
    // });
    return resultByTags;
  });

  return (
    <div class="flex flex-col gap-4 w-full h-content">
      <div class="flex flex-row items-center gap-4 justify-between w-full">
        <div class="flex flex-row items-center gap-4 w-full">
          <TextField class="w-full" value={search()} onChange={(value) => setSearch(value)}>
            <TextFieldInput class="w-full rounded-lg px-4" placeholder="Search for documents..." />
          </TextField>
        </div>
        <div class="flex flex-row items-center gap-4 w-max">
          <For each={tags()}>
            {(tag) => (
              <div class="inline-flex items-center space-x-2.5 rounded-lg py-1 pl-2.5 pr-1 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 bg-background">
                <span class="text-sm font-medium">{tag}</span>
                <button
                  type="button"
                  class="rounded-sm bg-muted/10 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted/20"
                >
                  <X class="size-4" />
                </button>
              </div>
            )}
          </For>
          <Popover placement="bottom-end">
            <PopoverTrigger as={Button} size="icon" variant="secondary" disabled={props.documents().length === 0}>
              <RectangleHorizontal class="size-4" />
            </PopoverTrigger>
            <PopoverContent>
              <For each={Array.from(new Set(...props.documents().map((d) => d.type)).values())}>
                {(type) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-8 pl-3 pr-2 text-sm font-medium"
                    onClick={() => {
                      if (tags().includes(type)) {
                        setTags(tags().filter((t) => t !== type));
                      } else {
                        setTags([...tags(), type]);
                      }
                    }}
                  >
                    {type}
                  </Button>
                )}
              </For>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div class="rounded-lg border h-content w-full flex flex-col gap-4">
        <div
          class={cn("grid grid-cols-2 gap-4 w-full overflow-y-auto", {
            "p-4": filterDocuments().length > 0,
          })}
        >
          <For
            each={filterDocuments()}
            fallback={
              <div class="w-full grow flex flex-col items-center justify-center col-span-full py-10 bg-muted-foreground/10 rounded-md text-sm text-muted-foreground">
                No documents found
              </div>
            }
          >
            {(d) => (
              <div
                class="flex flex-row items-center gap-4 rounded-lg border p-2 cursor-pointer hover:bg-muted-foreground/10"
                onClick={() => {
                  props.setSelectedDocument(d);
                }}
              >
                <div class="flex flex-row items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                    <div class="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center">
                      <div class="w-2 h-2 rounded-full bg-foreground/10 flex items-center justify-center">
                        <div class="w-1 h-1 rounded-full bg-foreground/10 flex items-center justify-center">
                          <div class="w-1 h-1 rounded-full bg-foreground/10 flex items-center justify-center">
                            {d.type === "pdf" && <FileSearch class="size-4" />}
                            {d.type === "image" && <RotateCw class="size-4" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="text-sm font-medium">{d.name}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
