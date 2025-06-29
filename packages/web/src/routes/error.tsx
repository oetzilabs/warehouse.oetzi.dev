import { A, useSearchParams } from "@solidjs/router";

export default function ErrorPage() {
  const [searchP] = useSearchParams();
  return (
    <main class="py-10 container mx-auto flex flex-col items-center justify-center h-[calc(100dvh-49px)]">
      <div class="flex flex-col gap-4 -mt-[200px]">
        <div class="flex flex-col items-start space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-8">
          <p class="font-semibold text-red-500/50 text-9xl">Error</p>
          <div class="flex flex-col gap-2">
            <h1 class="flex items-center space-x-2">
              <svg
                aria-hidden="true"
                class="w-6 h-6 text-red-500/50"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span class="text-xl font-medium text-neutral-600 sm:text-2xl ">Oops...</span>
            </h1>
            <p class="text-base font-normal text-neutral-600">Something went wrong.</p>
            <pre>{searchP.message}</pre>
            <p class="text-base font-normal text-neutral-600 flex flex-row gap-1">
              You may return to
              <A href="/" class="text-blue-600 hover:underline dark:text-blue-500">
                home page
              </A>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
