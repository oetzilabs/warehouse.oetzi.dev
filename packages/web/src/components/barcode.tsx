import jsbarcode from "jsbarcode";
import { onMount } from "solid-js";

export default function Barcode(props: { value: string }) {
  onMount(() => {
    jsbarcode("#barcode", props.value);
  });
  return <svg id="barcode" class="w-max"></svg>;
}
