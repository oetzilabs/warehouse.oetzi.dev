// @refresh reload
import { Toaster } from "@/components/providers/Toaster";
import { TranslationsProvider } from "@/components/providers/TranslationProvider";
import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from "@kobalte/core";
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
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
        <div class="fixed z-[99999] flex flex-row items-center justify-center inset-0 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <div class="flex flex-col gap-6 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-950 items-center justify-center">
            <span class="text-red-500 font-medium">Something went wrong...</span>
            <Show
              when={error instanceof Error}
              fallback={<pre class="font-mono w-96 h-80 overflow-x-scroll">{JSON.stringify(error, null, 2)}</pre>}
            >
              <pre class="font-mono w-96 h-80 overflow-x-scroll">{error.message}</pre>
              <pre class="font-mono w-96 h-80 overflow-x-scroll">{error.stack}</pre>
            </Show>
            <div class="flex flex-row gap-2 w-max">
              <button onClick={() => reset()}>RESET</button>
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
            <Title>WareHouse. Portal</Title>
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
                      <AppLayout>{props.children}</AppLayout>
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
