// @refresh reload
import { Toaster } from "@/components/providers/Toaster";
import { TranslationsProvider } from "@/components/providers/TranslationProvider";
import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from "@kobalte/core";
import { MetaProvider, Title } from "@solidjs/meta";
import { createAsync, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
// import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
// import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import AlertCircleIcon from "lucide-solid/icons/alert-circle";
import CheckCheck from "lucide-solid/icons/check-check";
import Info from "lucide-solid/icons/info";
import Loader2 from "lucide-solid/icons/loader-2";
import { ErrorBoundary, Show, Suspense } from "solid-js";
import { isServer } from "solid-js/web";
import "./app.css";
import { UserProvider } from "./components/providers/User";
import { AppLayout } from "./layout";
import "@fontsource/pacifico";
import "@fontsource-variable/geist-mono";
import "@fontsource/lisu-bosa";
import { DashboardProvider } from "./components/providers/Dashboard";
import { Button } from "./components/ui/button";

export default function App() {
  // const queryClient = new QueryClient({
  //   defaultOptions: {
  //     queries: {
  //       retry: false,
  //       staleTime: 5000,
  //     },
  //   },
  // });

  const storageManager = cookieStorageManagerSSR(isServer ? "kb-color-mode=dark" : document.cookie);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div class="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <div class="p-6 flex flex-col gap-4">
              <div class="flex items-center gap-2 text-red-500">
                <AlertCircleIcon class="size-5" />
                <h2 class="text-lg font-semibold">Something went wrong</h2>
              </div>

              <div class="overflow-auto max-h-[60vh]">
                <Show
                  when={error instanceof Error}
                  fallback={
                    <pre class="font-mono text-sm p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                      {JSON.stringify(error, null, 2)}
                    </pre>
                  }
                >
                  <div class="space-y-2">
                    <pre class="font-mono text-sm p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                      {error.message}
                    </pre>
                    <pre class="font-mono text-sm p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                </Show>
              </div>

              <div class="flex justify-end pt-2 gap-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(String(error.stack));
                  }}
                  variant="outline"
                  class="bg-background"
                >
                  Copy Error
                </Button>
                <Button onClick={() => reset()}>Try again</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {/* <QueryClientProvider client={queryClient}>
        <SolidQueryDevtools /> */}
      <Router
        root={(props) => (
          <MetaProvider>
            <Title>warehouse.</Title>
            <Suspense
              fallback={
                <div class="w-full h-screen items-center justify-center flex flex-col">
                  <div class="w-max h-max px-10 py-16 flex flex-row items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 class="size-4 animate-spin" />
                    <span class="">Loading</span>
                  </div>
                </div>
              }
            >
              <TranslationsProvider>
                <ColorModeScript storageType={storageManager.type} initialColorMode="system" />
                <ColorModeProvider storageManager={storageManager}>
                  <Toaster
                    icons={{
                      info: <Info class="size-4" />,
                      success: <CheckCheck class="size-4" />,
                      error: <AlertCircleIcon class="size-4" />,
                      loading: <Loader2 class="size-4 animate-spin" />,
                      warning: <AlertCircleIcon class="size-4" />,
                    }}
                  />
                  <div
                    class="w-full flex flex-col"
                    style={{
                      "flex-grow": "1",
                      "min-height": "100vh",
                    }}
                  >
                    <UserProvider>
                      <DashboardProvider>
                        <AppLayout>{props.children}</AppLayout>
                      </DashboardProvider>
                    </UserProvider>
                  </div>
                </ColorModeProvider>
              </TranslationsProvider>
            </Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
      {/* </QueryClientProvider> */}
    </ErrorBoundary>
  );
}
