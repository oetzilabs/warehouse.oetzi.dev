import { MailDisplay } from "@/components/messages/mail-display";
import { MailList } from "@/components/messages/mail-list";
import { Nav } from "@/components/messages/nav";
import { useUser } from "@/components/providers/User";
import { Resizable, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getMessages } from "@/lib/api/messages";
import { cn } from "@/lib/utils";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { createAsync, RouteDefinition } from "@solidjs/router";
import { type MessageInfo } from "@warehouseoetzidev/core/src/entities/messages";
import Archive from "lucide-solid/icons/archive";
import File from "lucide-solid/icons/file";
import Inbox from "lucide-solid/icons/inbox";
import Mail from "lucide-solid/icons/mail";
import Messages from "lucide-solid/icons/messages-square";
import Updates from "lucide-solid/icons/rotate-ccw";
import Search from "lucide-solid/icons/search";
import Send from "lucide-solid/icons/send";
import ShoppingCart from "lucide-solid/icons/shopping-cart";
import Trash from "lucide-solid/icons/trash";
import Users from "lucide-solid/icons/users";
import { createSignal, Show, Suspense } from "solid-js";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const messages = getMessages();
    return { user, sessionToken, messages };
  },
} as RouteDefinition;

export default function MessagesPage() {
  const user = useUser();
  const mails = createAsync(() => getMessages(), { deferStream: true });
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
                    .filter((v) => !v.readAt)
                    .length.toString(),
                  icon: Inbox,
                  variant: "default",
                },
                {
                  title: "Drafts",
                  label: ms()
                    .filter((v) => v.type === "draft")
                    .length.toString(),
                  icon: File,
                  variant: "ghost",
                },
                {
                  title: "Sent",
                  label: ms()
                    .filter((v) => v.type === "normal" && v.sender === user.user()?.email)
                    .length.toString(),
                  icon: Send,
                  variant: "ghost",
                },
                {
                  title: "Trash",
                  label: ms()
                    .filter((v) => !v.deletedAt)
                    .length.toString(),
                  icon: Trash,
                  variant: "ghost",
                },
                {
                  title: "Archive",
                  label: ms()
                    .filter((v) => v.archivedAt)
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
            <h1 class="text-xl leading-0 font-bold">Inbox</h1>
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
          <TabsContent value="all" class="m-0 grow flex">
            <Suspense>
              <Show when={mails()}>
                {(ms) => <MailList type="all" onSelectedMail={setSelectedMail} selectedMail={selectedMail} list={ms} />}
              </Show>
            </Suspense>
          </TabsContent>
          <TabsContent value="unread" class="m-0 grow flex">
            <Suspense>
              <Show when={mails()}>
                {(ms) => (
                  <MailList type="unread" onSelectedMail={setSelectedMail} selectedMail={selectedMail} list={ms} />
                )}
              </Show>
            </Suspense>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel initialSize={sizes()[2] ?? 0.5} minSize={0.3} class="grow flex flex-col">
        <MailDisplay mail={selectedMail} />
      </ResizablePanel>
    </Resizable>
  );
}
