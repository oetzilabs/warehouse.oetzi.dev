import { Breadcrumbs } from "@kobalte/core/breadcrumbs";
import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Accessor } from "solid-js";

export const HeaderLinks = (props: { breadcrumbs: Accessor<Array<{ name: string; href: string }>> }) => {
  return (
    <Breadcrumbs>
      <ol class="flex flex-row items-center justify-start gap-2 text-sm leading-tight">
        <For each={props.breadcrumbs()}>
          {(crumb, index) => (
            <li class="flex flex-row items-center justify-start gap-2">
              <Breadcrumbs.Link as={A} href={crumb.href}>
                {crumb.name}
              </Breadcrumbs.Link>
              <Show when={index() !== props.breadcrumbs().length - 1}>
                <Breadcrumbs.Separator />
              </Show>
            </li>
          )}
        </For>
      </ol>
    </Breadcrumbs>
  );
};
