import { MailDisplay } from "@/components/messages/mail-display";
import { MailList } from "@/components/messages/mail-list";
import { Nav } from "@/components/messages/nav";
import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { Resizable, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getMessages } from "@/lib/api/messages";
import { cn } from "@/lib/utils";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { createAsync, RouteDefinition, useSearchParams } from "@solidjs/router";
import { type MessageInfo } from "@warehouseoetzidev/core/src/entities/messages";
import Archive from "lucide-solid/icons/archive";
import File from "lucide-solid/icons/file";
import Inbox from "lucide-solid/icons/inbox";
import Send from "lucide-solid/icons/send";
import Trash from "lucide-solid/icons/trash";
import { createSignal, Show, Suspense } from "solid-js";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    const query = props.location.query;
    const cursor = query.cursor ? parseInt(query.cursor as string) : 0;
    getMessages({ cursor });
  },
} as RouteDefinition;

export default function MessagesPage() {
  const user = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cursor, setCursor] = createSignal<number>(searchParams.cursor ? parseInt(searchParams.cursor as string) : 0);
  const mails = createAsync(() => getMessages({ cursor: cursor() }), { deferStream: true });
  const [sizes, setSizes] = makePersisted(createSignal<number[]>([]), {
    name: "resizable-sizes",
    storage: cookieStorage,
    storageOptions: {
      path: "/",
    },
  });

  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const [selectedMail, setSelectedMail] = createSignal<MessageInfo | null>(null);

  return (
    <Resizable sizes={sizes()} onSizesChange={setSizes} class="grow h-auto">
      <ResizablePanel
        initialSize={sizes()[0] ?? 0.1}
        minSize={0.1}
        maxSize={0.2}
        collapsible
        onCollapse={(e) => {
          setIsCollapsed(e === 0), console.log("collapse", e);
        }}
        onExpand={() => {
          setIsCollapsed(false), console.log("expand");
        }}
        class={cn(isCollapsed() && "min-w-[50px] transition-all duration-300 ease-in-out")}
      >
        <Show when={mails()}>
          {(ms) => (
            <Nav
              isCollapsed={isCollapsed()}
              links={[
                {
                  title: "Inbox",
                  label: ms()
                    .messages.filter((v) => !v.readAt)
                    .length.toString(),
                  icon: Inbox,
                  variant: "default",
                },
                {
                  title: "Drafts",
                  label: ms()
                    .messages.filter((v) => v.type === "draft")
                    .length.toString(),
                  icon: File,
                  variant: "ghost",
                },
                {
                  title: "Sent",
                  label: ms()
                    .messages.filter((v) => v.type === "normal" && v.sender === user.user()?.email)
                    .length.toString(),
                  icon: Send,
                  variant: "ghost",
                },
                {
                  title: "Trash",
                  label: ms()
                    .messages.filter((v) => !v.deletedAt)
                    .length.toString(),
                  icon: Trash,
                  variant: "ghost",
                },
                {
                  title: "Archive",
                  label: ms()
                    .messages.filter((v) => v.archivedAt)
                    .length.toString(),
                  icon: Archive,
                  variant: "ghost",
                },
              ]}
            />
          )}
        </Show>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel initialSize={sizes()[1] ?? 0.4} minSize={0.3} class="grow flex flex-col">
        <Tabs defaultValue="all" class="grow flex flex-col">
          <div class="flex flex-row items-center p-4 border-b border-neutral-200 dark:border-neutral-800 justify-between">
            <h1 class="text-xl leading-none font-bold">Inbox</h1>
            <TabsList class="!p-0 !py-0 border h-max rounded-lg overflow-clip">
              <TabsTrigger value="all" class="text-neutral-600 dark:text-neutral-200 h-[30px] rounded-r-none border-r">
                All mail
              </TabsTrigger>
              <TabsTrigger value="unread" class="text-neutral-600 dark:text-neutral-200 h-[30px] rounded-l-none">
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          <div class="p-4">
            <TextField>
              <TextFieldInput placeholder="Search" type="text" />
            </TextField>
          </div>
          <Suspense>
            <Show when={mails() && mails()}>
              {(ms) => (
                <div class="flex flex-col gap-0 w-full grow">
                  <TabsContent value="all" class="m-0 grow flex">
                    <MailList
                      type="all"
                      onSelectedMail={setSelectedMail}
                      selectedMail={selectedMail}
                      list={() => ms().messages}
                    />
                  </TabsContent>
                  <TabsContent value="unread" class="m-0 grow flex">
                    <MailList
                      type="unread"
                      onSelectedMail={setSelectedMail}
                      selectedMail={selectedMail}
                      list={() => ms().messages}
                    />
                  </TabsContent>
                  <div class="flex items-center justify-between p-4 w-full gap-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-neutral-600 dark:text-neutral-200">
                        Page {cursor() + 1} of {ms().pages}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={cursor() === 0}
                        onClick={() => {
                          if (cursor() === 0) return;
                          setSearchParams({ cursor: (cursor() - 1).toString() });
                          // setCursor((c) => Math.max(c - 1, 0));
                        }}
                      >
                        Previous page
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!ms().hasNextPage}
                        onClick={() => {
                          if (!ms().hasNextPage) return;
                          setSearchParams({ cursor: (cursor() + 1).toString() });
                          // setCursor((c) => c + 1);
                        }}
                      >
                        Next page
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </Suspense>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel initialSize={sizes()[2] ?? 0.5} minSize={0.3} class="grow flex flex-col">
        <MailDisplay mail={selectedMail} />
      </ResizablePanel>
    </Resizable>
  );
}
