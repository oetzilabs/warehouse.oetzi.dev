import { getAuthenticatedUser } from "@/lib/api/auth";
import { A, createAsync, query, RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";

const serverFn = query(async () => {
  "use server";
  return {
    files: Object.keys(import.meta.glob("./*.mdx")).map((f) => f.replace("./", "").replace(".mdx", "")),
  };
}, "getBlogs");

export const route = {
  preload: async (props) => {
    const session = await getAuthenticatedUser();
    // files from the same directory
    const files = await serverFn();
    return { session, files };
  },
  info: {
    title: "Blogs",
    description: "Blogs about the Warehouse System",
  },
} satisfies RouteDefinition;

export default function Blogs(props: RouteSectionProps) {
  const data = createAsync(() => serverFn(), { deferStream: true });
  return (
    <div class="flex flex-col gap-4 w-full">
      <Suspense fallback={<div class="flex flex-col gap-4 w-full">Loading...</div>}>
        <Show when={data()}>
          {(filesData) => (
            <For each={filesData().files}>
              {(file) => (
                <A href={`./${file}`} class="flex flex-col gap-2 items-start justify-start w-full capitalize">
                  {file}
                </A>
              )}
            </For>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
