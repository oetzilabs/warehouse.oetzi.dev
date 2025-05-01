import { Authenticated } from "../../../components/Authenticated";

export default function DashboardPage() {
  return <Authenticated>{(u) => <div>Hello {u.user?.name}</div>}</Authenticated>;
}
