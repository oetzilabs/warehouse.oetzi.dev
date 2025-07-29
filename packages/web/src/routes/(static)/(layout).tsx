import { Footer } from "@/components/Footer";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { RouteDefinition } from "@solidjs/router";
import { JSXElement } from "solid-js";

export const route = {
  load: async (params) => {
    await getLocale();
    const session = await getAuthenticatedUser();
    return { session };
  },
} satisfies RouteDefinition;

export default function StaticLayout(props: { children: JSXElement }) {
  return (
    <div class="flex flex-col h-full w-full overflow-y-auto bg-background">
      <div class="container  px-4 flex-1 grow h-auto py-10">
        <div class="pb-24 py-10 prose prose-sm max-w-full prose-neutral dark:prose-invert prose-headings:font-['Lisu_Bosa'] prose-headings:font-medium">
          {props.children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
