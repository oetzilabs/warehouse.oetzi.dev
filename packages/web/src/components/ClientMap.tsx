// @refresh reload
import { useColorMode } from "@kobalte/core";
import { A } from "@solidjs/router";
import L, { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Accessor, createEffect, createSignal, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

const darkTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

const lightTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

export default function ClientMap(props: { coords: Accessor<[number, number]>; visible: Accessor<boolean> }) {
  let mapDiv: any;

  const [map, setMap] = createSignal<L.Map | null>(null);
  const { colorMode } = useColorMode();

  createEffect(() => {
    const visible = props.visible();
    let c = props.coords();
    const coords = new LatLng(c[0], c[1]);
    const marker = L.marker(coords, {
      icon: L.divIcon({
        html: `<div class="relative flex flex-col items-center justify-center bg-blue-500 -translate-x-[50%] -translate-y-[50%] w-[16px] h-[16px] rounded-full"></div>`,
        className: "bg-transparent",
      }),
    });
    if (!visible) return;
    const m = map();
    if (!m) {
      const newMap = L.map(mapDiv, {
        zoomControl: false,
        attributionControl: false,
      }).setView(c, 13);
      const featureGroup = L.featureGroup([marker]).addTo(newMap);
      newMap.fitBounds(featureGroup.getBounds());
      setMap(newMap);
    } else {
      const featureGroup = L.featureGroup([marker]).addTo(m);
      m.fitBounds(featureGroup.getBounds());
    }
  });

  createEffect(() => {
    const themeMode = colorMode();
    const m = map();
    if (!m) return;
    if (themeMode === "dark") {
      darkTile.addTo(m);
      lightTile.removeFrom(m);
    } else {
      lightTile.addTo(m);
      darkTile.removeFrom(m);
    }
  });

  return (
    <Show when={props.visible()} fallback={<div class="w-full h-full bg-muted/10 rounded-md" />}>
      <div class="w-full flex flex-col gap-4 h-full">
        <div class="border border-neutral-200 dark:border-neutral-800 rounded-md w-full flex flex-col items-center justify-center bg-muted h-full overflow-clip">
          <div
            ref={mapDiv}
            id="main-map"
            style={{
              position: "relative",
              "z-index": 10,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
        <div class="w-max text-muted-foreground text-xs">
          This map is provided by{" "}
          <A
            href="https://carto.com/attributions"
            class="hover:text-foreground font-bold underline underline-offset-2"
            rel="external"
            target="_new"
          >
            CARTO
          </A>{" "}
          via{" "}
          <A
            href="https://www.openstreetmap.org/copyright"
            class="hover:text-foreground font-bold underline underline-offset-2"
            rel="external"
            target="_new"
          >
            OpenStreetMap
          </A>{" "}
          and{" "}
          <A
            href="https://leafletjs.com/"
            class="hover:text-foreground font-bold underline underline-offset-2"
            rel="external"
            target="_new"
          >
            Leaflet
          </A>
        </div>
      </div>
    </Show>
  );
}
