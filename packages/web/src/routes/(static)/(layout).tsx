import { Footer } from "@/components/Footer";
import { getAuthenticatedSession } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { RouteLoadFuncArgs } from "@solidjs/router";
import { JSXElement } from "solid-js";

export const route = {
  load: async (params: RouteLoadFuncArgs) => {
    await getLocale();
    const session = await getAuthenticatedSession();
    return { session };
  },
};

export default function StaticLayout(props: { children: JSXElement }) {
  return (
    <>
      <div class="container px-4 flex-1 grow h-auto py-20">
        <div class="pb-24 py-10 prose max-w-full prose-neutral dark:prose-invert">{props.children}</div>
      </div>
      <Footer />
    </>
  );
}
