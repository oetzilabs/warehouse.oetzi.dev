import { DocumentList } from "@/components/lists/documents";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getDocuments } from "@/lib/api/documents";
import { createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getDocuments();
  },
} as RouteDefinition;

export default function DocumentsPage() {
  const documents = createAsync(() => getDocuments(), { deferStream: true });

  return (
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={documents()}>
        {(ds) => (
          <div class="container flex flex-col grow py-4">
            <div class="w-full flex flex-row h-full gap-4">
              <div class="w-full flex flex-col gap-4">
                <div class="flex items-center gap-4 justify-between w-full">
                  <h1 class="font-semibold leading-none">Documents</h1>
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
                <div class="flex flex-col gap-4 w-full grow">
                  <DocumentList documents={ds} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
