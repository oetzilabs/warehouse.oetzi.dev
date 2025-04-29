// import { Billing } from "@/components/settings/Billing";
import { Authenticated } from "@/components/Authenticated";
import { Account } from "@/components/settings/Account";
import { Dangerzone } from "@/components/settings/Dangerzone";
import { Notifications } from "@/components/settings/Notifications";
import { Organizations } from "@/components/settings/Organization";
import { SessionList } from "@/components/settings/SessionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedSession } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { RouteDefinition } from "@solidjs/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import BellRing from "lucide-solid/icons/bell-ring";
import Building from "lucide-solid/icons/building";
import KeyRound from "lucide-solid/icons/key-round";
import Loader2 from "lucide-solid/icons/loader-2";
import User from "lucide-solid/icons/user";
import X from "lucide-solid/icons/x";
import { onMount, Suspense } from "solid-js";

dayjs.extend(relativeTime);

export const route = {
  preload: async (params) => {
    await getLocale();
    const session = await getAuthenticatedSession();
    return { session };
  },
} satisfies RouteDefinition;

export default function ProfileSettingsPage() {
  onMount(() => {
    document.title = `Settings | WareHouse Portal`;
  });
  return (
    <Authenticated>
      {(session) => (
        <div class="flex flex-row w-full h-full md:container md:px-0 border border-neutral-200 dark:border-neutral-800 rounded-md overflow-clip">
          <Tabs class="w-full py-0" orientation="vertical">
            <TabsList class="flex flex-col gap-2 p-2 w-[200px]">
              <TabsTrigger
                class="items-center justify-start gap-2 hover:bg-muted/50 rounded-md !border-none data-[selected]:bg-muted"
                value="account"
              >
                <User class="w-4 h-4" />
                Account
              </TabsTrigger>
              <TabsTrigger
                class="items-center justify-start gap-2 hover:bg-muted/50 rounded-md !border-none data-[selected]:bg-muted"
                value="sessions"
              >
                <KeyRound class="w-4 h-4" />
                Sessions
              </TabsTrigger>
              <TabsTrigger
                class="items-center justify-start gap-2 hover:bg-muted/50 rounded-md !border-none data-[selected]:bg-muted"
                value="organizations"
              >
                <Building class="w-4 h-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger
                class="items-center justify-start gap-2 hover:bg-muted/50 rounded-md !border-none data-[selected]:bg-muted"
                value="notifications"
              >
                <BellRing class="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                class="items-center justify-start gap-2 text-red-500 hover:bg-red-100/50 rounded-md !border-none data-[selected]:bg-red-100 data-[selected]:text-red-500"
                value="dangerzone"
              >
                <X class="w-4 h-4" />
                Dangerzone
              </TabsTrigger>
            </TabsList>
            <div class="p-2 flex flex-col w-full grow">
              <TabsContent class="px-0 py-0 mt-0 flex flex-col w-full gap-8" value="account">
                <Suspense
                  fallback={
                    <div class="flex p-4 w-full h-full items-center justify-center">
                      <div class="w-max h-max min-w-96">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <Account session={session.session} />
                </Suspense>
              </TabsContent>
              <TabsContent class="px-0 py-0 mt-0 w-full flex flex-col gap-8" value="sessions">
                <Suspense
                  fallback={
                    <div class="flex p-4 w-full h-full items-center justify-center">
                      <div class="w-max h-max min-w-96">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <SessionList session={session.session} />
                </Suspense>
              </TabsContent>
              <TabsContent class="px-0 py-0 mt-0 w-full flex flex-col gap-8" value="organizations">
                <Suspense
                  fallback={
                    <div class="flex p-4 w-full h-full items-center justify-center">
                      <div class="w-max h-max min-w-96">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <Organizations session={session.session} />
                </Suspense>
              </TabsContent>
              <TabsContent class="px-0 py-0 mt-0 w-full flex flex-col gap-8" value="notifications">
                <Suspense
                  fallback={
                    <div class="flex p-4 w-full h-full items-center justify-center">
                      <div class="w-max h-max min-w-96">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <Notifications />
                </Suspense>
              </TabsContent>
              <TabsContent class="px-0 py-0 mt-0 w-full flex flex-col gap-8" value="dangerzone">
                <Suspense
                  fallback={
                    <div class="flex p-4 w-full h-full items-center justify-center">
                      <div class="w-max h-max min-w-96">
                        <Loader2 class="size-4 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <Dangerzone />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </Authenticated>
  );
}
