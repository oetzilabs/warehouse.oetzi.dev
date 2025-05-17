import { DocumentsDataTable } from "@/components/documents/documents-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDocuments } from "@/lib/api/documents";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { DocumentInfo } from "@warehouseoetzidev/core/src/entities/documents";
import dayjs from "dayjs";
import FileSearch from "lucide-solid/icons/file-search";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const orders = getDocuments();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function DocumentsPage() {
  const params = useParams();
  const documents = createAsync(() => getDocuments(), { deferStream: true });
  const [selectedDocument, setSelectedDocument] = createSignal<DocumentInfo | null>(null);

  return (
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={documents()}>
        {(ds) => (
          <div class="w-full flex flex-row grow">
            <div class="w-full p-4 flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="text-2xl font-bold leading-0">Documents</h1>
                <div class="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="secondary"
                    class="size-8"
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
                  <Button size="sm" class="h-8 pl-2">
                    <Upload class="size-4" />
                    Upload
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-2 w-full rounded-lg border h-60"></div>
              <DocumentsDataTable data={ds} onSelectedDocument={setSelectedDocument} />
            </div>
            <div class="w-full max-w-xl border-l flex flex-col grow">
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
        )}
      </Show>
    </Suspense>
  );
}
