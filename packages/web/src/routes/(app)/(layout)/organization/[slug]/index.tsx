import { Footer } from "@/components/Footer";
import { getAuthenticatedSession } from "@/lib/api/auth";
import { getLocale } from "@/lib/api/locale";
import { getOrganizationBySlug } from "@/lib/api/organizations";
import { createAsync, RouteDefinition, useParams } from "@solidjs/router";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import { onMount } from "solid-js";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export const route = {
  preload: async (props) => {
    await getAuthenticatedSession();
    await getLocale();
    const org = await getOrganizationBySlug(props.params.slug);
    return org;
  },
} satisfies RouteDefinition;

export default function OrganizationStatisticsPage() {
  const params = useParams();
  const organization = createAsync(() => getOrganizationBySlug(params.slug));

  onMount(() => {
    document.title = `Dashboard - ${organization()?.name} | WareHouse Portal`;
  });

  return (
    <>
      <div class="flex grow w-full" />
      <Footer />
    </>
  );
}
