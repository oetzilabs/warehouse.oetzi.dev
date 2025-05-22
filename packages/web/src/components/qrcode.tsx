import qrious from "qrious";
import { onMount } from "solid-js";

export default function QRCode(props: { value: string }) {
  onMount(() => {
    new qrious({
      element: document.getElementById("qr"),
      value: props.value,
    });
  });
  return <canvas id="qr" class="size-40"></canvas>;
}
