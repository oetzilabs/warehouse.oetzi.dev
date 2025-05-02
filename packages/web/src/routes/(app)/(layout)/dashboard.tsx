import { Authenticated } from "@/components/Authenticated";

export default function DashboardPage() {
  return <Authenticated>{(user) => <div class="w-full h-full flex"></div>}</Authenticated>;
}
