// @refresh reload
import { useColorMode } from "@kobalte/core";
import { A } from "@solidjs/router";
import L, { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Accessor, createEffect, createSignal, onMount } from "solid-js";

const darkTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

const lightTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

export default function ClientMap(props: { coords: Accessor<[number, number]> }) {
  let mapDiv: any;

  const [map, setMap] = createSignal<L.Map | null>(null);
  const { colorMode } = useColorMode();

  onMount(() => {
    const m = map();
    if (!m) {
      const c = props.coords();
      const newMap = L.map(mapDiv, {
        zoomControl: false,
        attributionControl: false,
      }).setView(c, 13);
      const coords = new LatLng(c[0], c[1]);
      const marker = L.marker(coords, {
        icon: L.divIcon({
          html: `<div class="relative flex flex-col items-center justify-center bg-blue-500 -translate-x-[50%] -translate-y-[50%] w-[25px] h-[25px] rounded-full"></div>`,
          className: "bg-transparent",
        }),
      });
      const featureGroup = L.featureGroup([marker]).addTo(newMap);
      newMap.fitBounds(featureGroup.getBounds());
      setMap(newMap);
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
  );
}
