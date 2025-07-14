import { DocumentList } from "@/components/lists/documents";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDocuments } from "@/lib/api/documents";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Notebook from "lucide-solid/icons/notebook";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const documents = await getDocuments();
    return { user, sessionToken, documents };
  },
} as RouteDefinition;

export default function DocumentsPage() {
  const documents = createAsync(() => getDocuments(), { deferStream: true });

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col gap-0">
          <div class="flex items-center gap-2 justify-between w-full bg-background pb-2">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <Notebook class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Documents</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
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
              <Button size="sm" class="pl-2.5 rounded-l-none">
                <Upload class="size-4" />
                Upload
              </Button>
            </div>
          </div>
          <Suspense
            fallback={
              <div class="p-4 w-full items-center justify-center h-full flex">
                <Loader2 class="size-4 animate-spin" />
                <span class="text-sm">Loading...</span>
              </div>
            }
          >
            <Show when={documents()}>
              {(ds) => (
                <div class="flex flex-col gap-4 w-full grow">
                  <DocumentList documents={ds} />
                </div>
              )}
            </Show>
          </Suspense>
        </div>
      </div>
      <div class="hidden md:flex w-px h-full bg-border"></div>
      <div class="w-0 md:w-[500px] h-full"></div>
    </div>
  );
}
