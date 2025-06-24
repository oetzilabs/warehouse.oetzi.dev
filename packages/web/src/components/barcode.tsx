import jsbarcode from "jsbarcode";
import { onMount } from "solid-js";
import { cn } from "../lib/utils";

export default function Barcode(props: { value: string }) {
  onMount(() => {
    jsbarcode("#barcode", props.value, {
      marginLeft: 16,
      marginRight: 16,
      marginTop: 16,
    });
  });
  return <svg id="barcode" class="md:w-max max-w-[364px] md:max-w-full h-32" />;
}
