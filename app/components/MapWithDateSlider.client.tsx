// @ts-nocheck — leaflet has no @types in this project; esbuild resolves it fine
import React, { useEffect, useRef, useMemo, useState } from "react";
import L from "leaflet";
import { WarpedMapLayer } from "@allmaps/leaflet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TileLayer = {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
};

type GeorefAnnotation = {
  name: string;
  url: string; // Allmaps / IIIF Georeference Annotation URL
};

type NavManifest = {
  id: string;
  slug: string;
  href: string;
  title: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  features: { id: string; label: string; lat: number; lng: number }[];
};

type SearchRecord = { id: string; href: string };
type SearchIndexEntry = { id: string; metadata: string[] };

type EnrichedMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  href: string;
  thumbnail: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  dateBuilt: number | null;
  dateRazed: number | null; // still-standing buildings use the current year, for filtering
  standing: boolean;
};

// ---------------------------------------------------------------------------
// Module-level singletons
// ---------------------------------------------------------------------------

let cssInjected = false;
let mcScriptPromise: Promise<void> | null = null;

function ensureLeafletCss(): void {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;

  const basePath = typeof window !== "undefined" ? ((window as any).CANOPY_BASE_PATH || "") : "";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${basePath}/scripts/canopy-map.css`;
  document.head.appendChild(link);

  // Dual-range slider: disable track click, re-enable on thumb only, custom thumb style
  const style = document.createElement("style");
  style.textContent = `
    .cdrs input[type=range] {
      -webkit-appearance: none; appearance: none;
      pointer-events: none;
      background: transparent;
      position: absolute; width: 100%; height: 20px; margin: 0; padding: 0;
    }
    .cdrs input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      pointer-events: all;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #500000;
      border: 2px solid #fff;
      cursor: pointer;
      box-shadow: 0 1px 5px rgba(0,0,0,.55);
    }
    .cdrs input[type=range]::-moz-range-thumb {
      pointer-events: all;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #500000;
      border: 2px solid #fff;
      cursor: pointer;
      box-shadow: 0 1px 5px rgba(0,0,0,.55);
    }
    .cdrs input[type=range]::-webkit-slider-runnable-track { background: transparent; }
    .cdrs input[type=range]::-moz-range-track { background: transparent; }
  `;
  document.head.appendChild(style);
}

/**
 * Load leaflet.markercluster from CDN as a UMD script.
 * We assign our bundled L to window.L first so the plugin patches the same
 * instance we're using — not a separate Leaflet copy loaded by Canopy.
 */
function loadMarkerCluster(): Promise<void> {
  if (mcScriptPromise) return mcScriptPromise;
  mcScriptPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }
    // Ensure our L is the global target before the plugin loads
    (window as any).L = L;
    if ((L as any).markerClusterGroup) { resolve(); return; }
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(script);
  });
  return mcScriptPromise;
}

// ---------------------------------------------------------------------------
// Full screen helpers
// ---------------------------------------------------------------------------

const EXPAND_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const COMPRESS_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 1v5H1M15 6h-5V1M10 15v-5h5M1 10h5v5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

// Cluster toggle icons show the action the button will take
const UNGROUP_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="3" cy="3" r="2.25" fill="currentColor"/><circle cx="13" cy="5" r="2.25" fill="currentColor"/><circle cx="6" cy="13" r="2.25" fill="currentColor"/></svg>`;
const GROUP_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="currentColor"/><text x="8" y="11" text-anchor="middle" font-size="8" font-weight="700" font-family="sans-serif" fill="#fff">3</text></svg>`;

function setClusterButtonState(btn: HTMLAnchorElement, clustered: boolean): void {
  const label = clustered ? "Ungroup markers" : "Group markers";
  btn.innerHTML = clustered ? UNGROUP_ICON : GROUP_ICON;
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.setAttribute("aria-pressed", String(!clustered));
}

// Georeferenced overlay toggle icons
const OVERLAY_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 1.5 15 5.25 8 9 1 5.25Z" fill="currentColor"/><path d="M1 8.25 8 12l7-3.75M1 11.25 8 15l7-3.75" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

function setOverlayButtonState(btn: HTMLAnchorElement, visible: boolean): void {
  const text = visible ? "Hide historic imagery" : "Show historic imagery";
  btn.title = text;
  btn.setAttribute("aria-label", text);
  btn.setAttribute("aria-pressed", String(visible));
  btn.style.color = visible ? "#fff" : "#500000";
  btn.style.background = visible ? "#500000" : "";
}

/**
 * Stand-in for a WarpedMapLayer that can be toggled from the layer switcher.
 * The Allmaps layer reloads its annotation every time it is added to a map,
 * so it is created once, on first show, and afterwards only its pane is
 * hidden or shown.
 */
const GeorefToggleLayer = L.Layer.extend({
  initialize(url: string, pane: string) {
    this._url = url;
    this._paneName = pane;
  },
  onAdd(map: L.Map) {
    if (!this._warped) {
      this._warped = new WarpedMapLayer(this._url, { pane: this._paneName });
      this._warped.addTo(map);
    }
    map.getPane(this._paneName).style.display = "";
  },
  onRemove(map: L.Map) {
    map.getPane(this._paneName).style.display = "none";
  },
});

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement || (document as any).webkitFullscreenElement || null;
}

// iPhone Safari has no element Fullscreen API; there we fall back to a
// fixed-position overlay that covers the viewport.
function supportsNativeFullscreen(el: HTMLElement): boolean {
  return Boolean(el.requestFullscreen || (el as any).webkitRequestFullscreen);
}

// ---------------------------------------------------------------------------
// Year helpers
// ---------------------------------------------------------------------------

function parseYear(val: string | null | undefined): number | null {
  if (!val) return null;
  const m = String(val).match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapWithDateSlider({
  height = "800px",
  cluster = true,
  maxClusterRadius = 20,
  disableClusteringAtZoom = 19,
  tileLayers,
  georefAnnotations,
}: {
  iiifContent?: string; // accepted but unused — data comes from static files
  height?: string;
  cluster?: boolean;
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
  tileLayers?: TileLayer[];
  georefAnnotations?: GeorefAnnotation[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const initialBoundsSetRef = useRef(false);

  const [markers, setMarkers] = useState<EnrichedMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [clustered, setClustered] = useState(true);
  const clusterButtonRef = useRef<HTMLAnchorElement | null>(null);
  const toggleFullscreenRef = useRef<() => void>(() => {});
  const fullscreenButtonRef = useRef<HTMLAnchorElement | null>(null);

  toggleFullscreenRef.current = () => {
    const root = rootRef.current;
    if (!root) return;
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
    } else if (getFullscreenElement()) {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    } else if (supportsNativeFullscreen(root)) {
      // Embedded contexts (e.g. an iframe without allowfullscreen) reject the
      // request; use the overlay instead. Older webkit returns no promise.
      const req = (root.requestFullscreen || (root as any).webkitRequestFullscreen).call(root);
      req?.catch?.(() => setPseudoFullscreen(true));
    } else {
      setPseudoFullscreen(true);
    }
  };

  // ── 1. CSS + MarkerCluster ─────────────────────────────────────────────
  useEffect(() => {
    ensureLeafletCss();
    loadMarkerCluster().then(() => setMapReady(true));
  }, []);

  // ── 1b. Track full screen state ────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      const active = getFullscreenElement() === rootRef.current;
      setFullscreen(active || pseudoFullscreen);
    };
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [pseudoFullscreen]);

  // Escape exits the overlay fallback (the browser handles it for native)
  useEffect(() => {
    if (!pseudoFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPseudoFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pseudoFullscreen]);

  // Resize the map and update the button whenever full screen changes
  useEffect(() => {
    mapInstanceRef.current?.invalidateSize();
    const btn = fullscreenButtonRef.current;
    if (btn) {
      const label = fullscreen ? "Exit full screen" : "View full screen";
      btn.innerHTML = fullscreen ? COMPRESS_ICON : EXPAND_ICON;
      btn.title = label;
      btn.setAttribute("aria-label", label);
      btn.setAttribute("aria-pressed", String(fullscreen));
    }
  }, [fullscreen, mapReady]);

  useEffect(() => {
    if (clusterButtonRef.current) setClusterButtonState(clusterButtonRef.current, clustered);
  }, [clustered]);

  // ── 2. Fetch pre-built static data ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const bp = typeof window !== "undefined" ? ((window as any).CANOPY_BASE_PATH || "") : "";
    Promise.all([
      fetch(`${bp}/api/navplace.json`).then((r) => r.json()),
      fetch(`${bp}/api/search-records.json`).then((r) => r.json()),
      fetch(`${bp}/api/search-index.json`).then((r) => r.json()),
    ])
      .then(
        ([navData, records, indexData]: [
          { manifests: NavManifest[] },
          SearchRecord[],
          SearchIndexEntry[]
        ]) => {
          if (cancelled) return;

          const hrefToMeta = new Map<string, string[]>();
          records.forEach((rec) => {
            const entry = indexData.find((e) => e.id === rec.id);
            if (entry) hrefToMeta.set(rec.href, entry.metadata);
          });

          const enriched: EnrichedMarker[] = [];
          navData.manifests.forEach((manifest) => {
            const meta = hrefToMeta.get(manifest.href);
            const dateBuilt = parseYear(meta?.[0]) ?? 2025;
            const razedRaw = meta?.[1];
            const standing = !razedRaw || razedRaw.toLowerCase() === "present";
            const dateRazed = standing ? 2025 : (parseYear(razedRaw) ?? 2025);

            manifest.features.forEach((feature, i) => {
              enriched.push({
                id: feature.id || `${manifest.slug}-${i}`,
                lat: feature.lat,
                lng: feature.lng,
                title: manifest.title,
                href: manifest.href,
                thumbnail: manifest.thumbnail,
                thumbnailWidth: manifest.thumbnailWidth,
                thumbnailHeight: manifest.thumbnailHeight,
                dateBuilt,
                dateRazed,
                standing,
              });
            });
          });

          setMarkers(enriched);
          setLoading(false);
        }
      )
      .catch((err: Error) => {
        if (!cancelled) {
          setFetchError(err.message ?? "Unknown error");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── 3. Compute year range ──────────────────────────────────────────────
  const { minYear, maxYear } = useMemo(() => {
    if (!markers.length) return { minYear: 1870, maxYear: 2000 };
    let min = Infinity, max = -Infinity;
    markers.forEach(({ dateBuilt, dateRazed }) => {
      if (dateBuilt !== null) {
        if (dateBuilt < min) min = dateBuilt;
        if (dateBuilt > max) max = dateBuilt;
      }
      if (dateRazed !== null && dateRazed > max) max = dateRazed;
    });
    return {
      minYear: isFinite(min) ? min : 1870,
      maxYear: isFinite(max) ? max : 2000,
    };
  }, [markers]);

  // ── 4. Init slider to full span ───────────────────────────────────────
  useEffect(() => {
    if (markers.length && startYear === null) setStartYear(minYear);
    if (markers.length && endYear === null) setEndYear(maxYear);
  }, [markers, minYear, maxYear, startYear, endYear]);

  // ── 5. Filter markers ─────────────────────────────────────────────────
  const filteredMarkers = useMemo(() => {
    if (!markers.length || startYear === null || endYear === null) return markers;
    return markers.filter(({ dateBuilt, dateRazed }) => {
      if (dateBuilt > endYear) return false;
      if (dateRazed < startYear) return false;
      return true;
    });
  }, [markers, startYear, endYear]);

  // ── 6. Initialise Leaflet map ─────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      // The Allmaps plugin can't animate zooms of more than one level
      zoomAnimationThreshold: 1,
    });

    // Tile layers
    const layers = tileLayers ?? [];
    const baseMapLayers: Record<string, L.TileLayer> = {};
    if (layers.length > 0) {
      layers.forEach((tl, i) => {
        const layer = L.tileLayer(tl.url, {
          attribution: tl.attribution,
          maxZoom: tl.maxZoom ?? 19,
        });
        baseMapLayers[tl.name] = layer;
        if (i === 0) layer.addTo(map);
      });
    }

    // Georeferenced overlays sit above every base layer (tilePane, z 200) but
    // below vector overlays (400) and markers / clusters (600). Each gets its
    // own pane so later entries draw on top of earlier ones.
    const georefLayers: Record<string, L.Layer> = {};
    (georefAnnotations ?? []).forEach((ga, i) => {
      const paneName = `georef-${i}`;
      const pane = map.createPane(paneName);
      pane.style.zIndex = String(250 + i);
      pane.style.pointerEvents = "none";
      georefLayers[ga.name] = new GeorefToggleLayer(ga.url, paneName);
    });
    const georefList = Object.values(georefLayers);

    if (layers.length > 1 || georefList.length > 0) {
      L.control.layers(baseMapLayers, georefLayers).addTo(map);
    }

    // Full screen toggle, under the zoom buttons
    const FullscreenControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const bar = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        const btn = L.DomUtil.create("a", "", bar) as HTMLAnchorElement;
        btn.href = "#";
        btn.setAttribute("role", "button");
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.color = "#333";
        btn.innerHTML = EXPAND_ICON;
        btn.title = "View full screen";
        btn.setAttribute("aria-label", "View full screen");
        btn.setAttribute("aria-pressed", "false");
        L.DomEvent.disableClickPropagation(bar);
        L.DomEvent.on(btn, "click", (e) => {
          L.DomEvent.preventDefault(e);
          toggleFullscreenRef.current();
        });
        fullscreenButtonRef.current = btn;
        return bar;
      },
    });
    new FullscreenControl().addTo(map);

    // Group / ungroup toggle. Ungrouped markers stay separate at every zoom.
    if (cluster) {
      const ClusterControl = L.Control.extend({
        options: { position: "topleft" },
        onAdd() {
          const bar = L.DomUtil.create("div", "leaflet-bar leaflet-control");
          const btn = L.DomUtil.create("a", "", bar) as HTMLAnchorElement;
          btn.href = "#";
          btn.setAttribute("role", "button");
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.color = "#500000";
          setClusterButtonState(btn, true);
          L.DomEvent.disableClickPropagation(bar);
          L.DomEvent.on(btn, "click", (e) => {
            L.DomEvent.preventDefault(e);
            setClustered((c) => !c);
          });
          clusterButtonRef.current = btn;
          return bar;
        },
      });
      new ClusterControl().addTo(map);
    }

    // Show / hide every georeferenced overlay at once
    if (georefList.length > 0) {
      const anyVisible = () => georefList.some((l) => map.hasLayer(l));
      const OverlayControl = L.Control.extend({
        options: { position: "topleft" },
        onAdd() {
          const bar = L.DomUtil.create("div", "leaflet-bar leaflet-control");
          const btn = L.DomUtil.create("a", "", bar) as HTMLAnchorElement;
          btn.href = "#";
          btn.setAttribute("role", "button");
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.innerHTML = OVERLAY_ICON;
          setOverlayButtonState(btn, false);
          L.DomEvent.disableClickPropagation(bar);
          L.DomEvent.on(btn, "click", (e) => {
            L.DomEvent.preventDefault(e);
            const show = !anyVisible();
            georefList.forEach((l) => (show ? map.addLayer(l) : map.removeLayer(l)));
          });
          // Keep the button in sync with the layer switcher checkboxes
          map.on("layeradd layerremove", () => setOverlayButtonState(btn, anyVisible()));
          return bar;
        },
      });
      new OverlayControl().addTo(map);
    }

    // Default view while data loads
    map.setView([30.618, -96.336], 15);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      fullscreenButtonRef.current = null;
      clusterButtonRef.current = null;
      clusterGroupRef.current = null;
      initialBoundsSetRef.current = false;
    };
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 7. Sync markers to map ────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const useCluster =
      cluster && clustered && typeof (L as any).markerClusterGroup === "function";

    const group: any = useCluster
      ? (L as any).markerClusterGroup({
          maxClusterRadius,
          disableClusteringAtZoom,
          iconCreateFunction: (c: any) => {
            const n = c.getChildCount();
            // All styling inline so the number is guaranteed centered
            return L.divIcon({
              className: "",
              html: `<div style="
                width:40px;height:40px;
                background:#500000;
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                color:#fff;font-weight:700;font-size:13px;line-height:1;
                box-shadow:0 2px 8px rgba(0,0,0,.45);
                border:2px solid rgba(255,255,255,.35);
              ">${n}</div>`,
              iconSize: L.point(40, 40),
              iconAnchor: [20, 20],
            });
          },
        })
      : L.layerGroup();

    const bp = typeof window !== "undefined" ? ((window as any).CANOPY_BASE_PATH || "") : "";
    filteredMarkers.forEach((m) => {
      const icon = L.divIcon({
        className: "",
        html: `<img src="${m.thumbnail}" style="
          width:32px;height:32px;
          border-radius:50%;
          object-fit:cover;
          border:2px solid #500000;
          box-shadow:0 1px 5px rgba(0,0,0,.45);
          display:block;
        " alt="" />`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
      });

      const popupContent = `
        <div style="width:200px">
          <a href="${bp}${m.href}" style="text-decoration:none;color:inherit">
            <img src="${m.thumbnail}"
                 style="width:100%;height:130px;object-fit:cover;display:block"
                 alt="${m.title}" />
            <p style="margin:6px 4px 4px;font-size:0.85rem;font-weight:600;line-height:1.3">
              ${m.title}
            </p>
            ${
              m.dateBuilt
                ? `<p style="margin:0 4px 6px;font-size:0.75rem;color:#666">
                     ${m.dateBuilt} – ${m.standing ? "Present" : m.dateRazed}
                   </p>`
                : ""
            }
          </a>
        </div>`;

      L.marker([m.lat, m.lng], { icon })
        .bindPopup(popupContent)
        .addTo(group);
    });

    group.addTo(map);
    clusterGroupRef.current = group;

    // Fit bounds only on first data load, not on every slider change
    if (filteredMarkers.length > 0 && !initialBoundsSetRef.current) {
      const bounds = L.latLngBounds(
        filteredMarkers.map((m) => [m.lat, m.lng] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        initialBoundsSetRef.current = true;
      }
    }
  }, [filteredMarkers, mapReady, cluster, clustered, maxClusterRadius, disableClusteringAtZoom]);

  // ── Render ─────────────────────────────────────────────────────────────

  const sy = startYear ?? minYear;
  const ey = endYear ?? maxYear;
  const count = filteredMarkers.length;
  const total = markers.length;

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: "column",
        ...(fullscreen ? { height: "100dvh", background: "#fff" } : {}),
        ...(pseudoFullscreen ? { position: "fixed", inset: 0, zIndex: 10000 } : {}),
      }}
    >
      {/* Map container — always in DOM so the ref is available on first mount */}
      <div style={{ position: "relative", ...(fullscreen ? { flex: 1, minHeight: 0 } : {}) }}>
        {/* `position` must stay set: Leaflet relies on the container's
            inline position: relative, and dropping it lets the map panes
            escape the container's clipping. */}
        <div
          ref={mapContainerRef}
          style={{ position: "relative", height: fullscreen ? "100%" : height }}
        />

        {(loading || !mapReady) && !fetchError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.85)",
              zIndex: 1000,
              fontFamily: "var(--open-sans)",
              color: "var(--gray-600)",
            }}
          >
            Loading map…
          </div>
        )}

        {fetchError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.9)",
              zIndex: 1001,
              fontFamily: "var(--open-sans)",
              color: "red",
              padding: "1rem",
            }}
          >
            Error loading map data: {fetchError}
          </div>
        )}
      </div>

      {/* ── Slider bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#e9e4dc",
          padding: "0.6rem 1rem 0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--open-sans)",
            fontSize: "0.8rem",
            color: "#333",
          }}
        >
          <span>Date Range: {minYear} – {maxYear}</span>
          <span>{count} of {total} items</span>
        </div>

        {/* Dual-handle range slider */}
        <div className="cdrs" style={{ position: "relative", height: "20px" }}>
          {/* Base track */}
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            left: 0, right: 0, height: 4,
            background: "#bbb", borderRadius: 2, pointerEvents: "none",
          }} />
          {/* Colored fill between the two handles */}
          {maxYear > minYear && (
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: `${((sy - minYear) / (maxYear - minYear)) * 100}%`,
              right: `${((maxYear - ey) / (maxYear - minYear)) * 100}%`,
              height: 4, background: "#500000", borderRadius: 2,
              pointerEvents: "none",
            }} />
          )}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={sy}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setStartYear(Math.min(v, ey));
            }}
            style={{ zIndex: sy >= ey ? 2 : 1 }}
            aria-label={`Start year: ${sy}`}
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={ey}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setEndYear(Math.max(v, sy));
            }}
            style={{ zIndex: sy < ey ? 2 : 1 }}
            aria-label={`End year: ${ey}`}
          />
        </div>

        {/* Bottom row: start · span · end */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--open-sans)",
            fontSize: "0.75rem",
            color: "#555",
            paddingTop: "2px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#000", fontSize: "0.85rem" }}>{sy}</span>
          <span>{ey - sy} year span</span>
          <span style={{ fontWeight: 600, color: "#000", fontSize: "0.85rem" }}>{ey}</span>
        </div>
      </div>
    </div>
  );
}