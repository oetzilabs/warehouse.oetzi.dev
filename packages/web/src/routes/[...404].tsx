import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="flex flex-col items-center justify-center text-center h-[calc(100dvh-100px)] px-4 space-y-8">
      <div class="space-y-4">
        <h1 class="text-7xl text-primary font-['Pacifico'] dark:text-neutral-200">404</h1>
        <h2 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">This page doesn’t exist.</h2>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
          Maybe the link is outdated, broken, or was never here to begin with. That’s okay.
        </p>
      </div>
      <Button as={A} href="/" size="sm">
        Go back home
      </Button>
    </main>
  );
}
