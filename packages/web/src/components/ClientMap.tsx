// @refresh reload
import { useColorMode } from "@kobalte/core";
import { A } from "@solidjs/router";
import L, { LatLng, Map } from "leaflet"; // Import Map type
import "leaflet/dist/leaflet.css";
import { Accessor, createEffect, createSignal, onCleanup, onMount } from "solid-js"; // Import onCleanup
import { toast } from "solid-sonner";

const darkTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

const lightTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 20,
});

export default function ClientMap(props: { coords: Accessor<[number, number]> }) {
  let mapDiv: HTMLDivElement | undefined; // Specify HTMLDivElement type and allow undefined initially

  const [map, setMap] = createSignal<Map | null>(null); // Specify Leaflet Map type
  const { colorMode } = useColorMode();

  onMount(() => {
    if (!mapDiv) {
      // Should not happen with Solid's ref, but good practice
      console.error("Map div not found!");
      return;
    }

    const newMap = L.map(mapDiv, {
      zoomControl: false,
      attributionControl: false,
    });

    setMap(newMap);

    // Clean up the map instance when the component is unmounted
    onCleanup(() => {
      newMap.remove();
    });
  });

  createEffect(() => {
    const m = map();
    if (!m) return; // Wait for the map to be initialized

    let c = props.coords();
    const coords = new LatLng(c[0], c[1]);

    // Clear existing layers (specifically markers and feature groups)
    m.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.FeatureGroup) {
        m.removeLayer(layer);
      }
    });

    const marker = L.marker(coords, {
      icon: L.divIcon({
        html: `<div class="relative flex flex-col items-center justify-center bg-blue-500 -translate-x-[50%] -translate-y-[50%] w-[16px] h-[16px] rounded-full"></div>`,
        className: "bg-transparent",
      }),
    });

    const featureGroup = L.featureGroup([marker]).addTo(m);
    m.fitBounds(featureGroup.getBounds(), { animate: false }); // Prevent excessive animation on re-render
  });

  createEffect(() => {
    const themeMode = colorMode();
    const m = map();
    if (!m) return; // Wait for the map to be initialized

    if (themeMode === "dark") {
      darkTile.addTo(m);
      lightTile.removeFrom(m);
    } else {
      lightTile.addTo(m);
      darkTile.removeFrom(m);
    }
  });

  return (
    <div class="w-full flex flex-col gap-4 h-full relative">
      <div class="w-full flex flex-col items-center justify-center bg-muted h-full overflow-clip">
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
      <div class="absolute bottom-0 p-2 z-20 w-full">
        <div class="w-full text-muted-foreground text-xs bg-muted border shadow-sm rounded-md p-2">
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
    </div>
  );
}
