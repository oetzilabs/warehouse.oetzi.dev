import { DocumentList } from "@/components/lists/documents";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDocuments } from "@/lib/api/documents";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
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
    <div class="container flex flex-col grow py-0 relative">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col gap-0">
          <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
            <div class="flex flex-row items-center gap-4">
              <Button variant="outline" size="sm" as={A} href="/dashboard" class="bg-background">
                <ArrowLeft class="size-4" />
                Back
              </Button>
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
    </div>
  );
}
