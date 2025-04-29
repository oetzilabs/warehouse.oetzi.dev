import { JSXElement } from "solid-js";

export default function DashboardLayout(props: { children: JSXElement }) {
  return (
    <div class="w-full flex flex-col gap-0 grow pt-12">
      <div class="w-full flex flex-col grow">{props.children}</div>
    </div>
  );
}
