import { Authenticated } from "@/components/Authenticated";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { onMount } from "solid-js";

export default function DashboardPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  onMount(() => {
    setBreadcrumbs([
      {
        label: "Dashboard",
        href: "/dashboard",
      },
    ]);
  });
  return <Authenticated skipOnboarding={false}>{(user) => <div class="w-full h-full flex"></div>}</Authenticated>;
}
