import { getWarehouseSaleById } from "@/lib/api/sales";
import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";

export default function SaleIdPage() {
  const params = useParams();
  const sale = createAsync(() => getWarehouseSaleById(params.whid, params.salesid), { deferStream: true });

  return (
    <Show when={sale()}>
      {(s) => (
        <div class="">
          <span>{s().status}</span>
          <span>{s().items.length}</span>
          <span>{s().note}</span>
          <span>{s().total}</span>
        </div>
      )}
    </Show>
  );
}
