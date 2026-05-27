// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

type TourStop = {
  lat: number;
  lng: number;
  headline: string;
  body: string;
  imageUrl: string;
  caption: string;
};

type SlideRaw = {
  type?: string;
  location?: { lat: number; lon: number };
  text?: { headline?: string; text?: string };
  media?: { url?: string; caption?: string };
};

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let cssInjected = false;
function ensureCss() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const bp = (window as any).CANOPY_BASE_PATH || '';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${bp}/scripts/canopy-map.css`;
  document.head.appendChild(link);
}

const GEOFENCE_M = 40;
const MAROON = '#500000';

export default function WalkingTour({
  data,
  height = '600px',
}: {
  data: string;
  height?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userDotRef = useRef<L.CircleMarker | null>(null);
  const accuracyRingRef = useRef<L.Circle | null>(null);
  const watchRef = useRef<number | null>(null);

  const [stops, setStops] = useState<TourStop[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [gpsOn, setGpsOn] = useState(false);
  const [gpsErr, setGpsErr] = useState<string | null>(null);

  // ── load tour data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const bp = typeof window !== 'undefined' ? (window as any).CANOPY_BASE_PATH || '' : '';
    const url = data.startsWith('http') ? data : `${bp}${data}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const parsed: TourStop[] = (json.storymap?.slides as SlideRaw[])
          .filter((s) => s.type !== 'overview' && s.location)
          .map((s) => ({
            lat: s.location!.lat,
            lng: s.location!.lon,
            headline: s.text?.headline ?? '',
            body: s.text?.text ?? '',
            imageUrl: s.media?.url ?? '',
            caption: s.media?.caption ?? '',
          }));
        setStops(parsed);
      })
      .catch(console.error);
  }, [data]);

  // ── init Leaflet map ───────────────────────────────────────────────────────
  useEffect(() => {
    ensureCss();
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: true });
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20 }
    ).addTo(map);
    map.setView([30.613, -96.341], 16);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── draw route + stop markers once data arrives ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || stops.length === 0) return;

    const latlngs: [number, number][] = stops.map((s) => [s.lat, s.lng]);

    L.polyline(latlngs, {
      color: MAROON, weight: 3, dashArray: '8 5', opacity: 0.7,
    }).addTo(map);

    stops.forEach((stop, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:${MAROON};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);cursor:pointer">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([stop.lat, stop.lng], { icon })
        .on('click', () => { setActiveIdx(i); setPanelOpen(true); })
        .addTo(map);
    });

    const bounds = L.latLngBounds(latlngs);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 100] });
  }, [stops]);

  // ── pan to active stop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeIdx === null || !mapRef.current || !stops[activeIdx]) return;
    const s = stops[activeIdx];
    mapRef.current.panTo([s.lat, s.lng], { animate: true, duration: 0.5 });
  }, [activeIdx, stops]);

  // ── GPS position handler ───────────────────────────────────────────────────
  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const map = mapRef.current;
      if (!map) return;

      if (userDotRef.current) {
        userDotRef.current.setLatLng([latitude, longitude]);
        accuracyRingRef.current?.setLatLng([latitude, longitude]);
        accuracyRingRef.current?.setRadius(accuracy);
      } else {
        accuracyRingRef.current = L.circle([latitude, longitude], {
          radius: accuracy, color: '#1a73e8', fillColor: '#1a73e8',
          fillOpacity: 0.12, weight: 1,
        }).addTo(map);
        userDotRef.current = L.circleMarker([latitude, longitude], {
          radius: 8, color: '#fff', fillColor: '#1a73e8', fillOpacity: 1, weight: 2,
        }).addTo(map);
      }

      // Geofence check — trigger unvisited stops within radius
      setVisited((prev) => {
        let changed = false;
        const next = new Set(prev);
        stops.forEach((stop, i) => {
          if (prev.has(i)) return;
          if (haversineMeters(latitude, longitude, stop.lat, stop.lng) <= GEOFENCE_M) {
            next.add(i);
            changed = true;
            setActiveIdx(i);
            setPanelOpen(true);
          }
        });
        return changed ? next : prev;
      });
    },
    [stops]
  );

  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsErr('Geolocation is not supported in this browser.');
      return;
    }
    setGpsOn(true);
    setGpsErr(null);
    watchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (e) => setGpsErr(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [handlePosition]);

  const stopGps = useCallback(() => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setGpsOn(false);
  }, []);

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const stop = activeIdx !== null ? stops[activeIdx] : null;

  return (
    <div style={{ position: 'relative', height }}>
      {/* Map */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* GPS toggle */}
      <div style={{ position: 'absolute', top: 10, right: 50, zIndex: 1000 }}>
        <button
          onClick={gpsOn ? stopGps : startGps}
          style={{
            background: gpsOn ? '#1a73e8' : '#fff',
            color: gpsOn ? '#fff' : '#333',
            border: `2px solid ${gpsOn ? '#1a73e8' : '#ccc'}`,
            borderRadius: 4, padding: '5px 11px',
            fontFamily: 'var(--open-sans)', fontSize: '0.8rem',
            cursor: 'pointer', boxShadow: '0 1px 5px rgba(0,0,0,.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {gpsOn ? '● GPS On' : '◎ Enable GPS'}
        </button>
        {gpsErr && (
          <div style={{
            marginTop: 4, background: '#fff3f3', border: '1px solid #d00',
            borderRadius: 4, padding: '4px 8px',
            fontFamily: 'var(--open-sans)', fontSize: '0.73rem', color: '#c00',
            maxWidth: 200,
          }}>
            {gpsErr}
          </div>
        )}
      </div>

      {/* Stop selector pill */}
      <div style={{
        position: 'absolute',
        bottom: panelOpen ? 'calc(min(45vh, 100%) + 16px)' : 16,
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 5,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(6px)',
        borderRadius: 24, padding: '5px 9px',
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
        transition: 'bottom 0.3s ease',
      }}>
        {stops.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); setPanelOpen(true); }}
            title={stops[i].headline}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              border: `2px solid ${MAROON}`,
              background: activeIdx === i ? MAROON : (visited.has(i) ? '#8a3030' : '#fff'),
              color: activeIdx === i || visited.has(i) ? '#fff' : MAROON,
              fontWeight: 700, fontSize: 11, cursor: 'pointer', lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div
        aria-hidden={!panelOpen}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1001,
          background: '#fff',
          transform: panelOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
          maxHeight: '45vh', overflowY: 'auto',
          boxShadow: '0 -2px 16px rgba(0,0,0,.18)',
          borderRadius: '12px 12px 0 0',
        }}
      >
        {/* Drag handle */}
        <div
          role="button"
          aria-label="Close panel"
          onClick={() => setPanelOpen(false)}
          style={{
            width: 40, height: 4, background: '#ddd', borderRadius: 2,
            margin: '10px auto 0', cursor: 'pointer',
          }}
        />

        {/* Panel header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px 8px',
          position: 'sticky', top: 0, background: '#fff',
          borderBottom: '1px solid #eee', zIndex: 1,
        }}>
          <span style={{
            fontFamily: 'var(--open-sans)', fontWeight: 700, fontSize: '0.72rem',
            color: MAROON, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Stop {(activeIdx ?? 0) + 1} of {stops.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              aria-label="Previous stop"
              onClick={() => activeIdx !== null && activeIdx > 0 && setActiveIdx(activeIdx - 1)}
              disabled={activeIdx === 0 || activeIdx === null}
              style={{
                background: 'none', border: 'none', fontSize: 22, color: MAROON,
                cursor: 'pointer', opacity: (activeIdx === 0 || activeIdx === null) ? 0.3 : 1,
                lineHeight: 1, padding: '0 4px',
              }}
            >‹</button>
            <button
              aria-label="Next stop"
              onClick={() => activeIdx !== null && activeIdx < stops.length - 1 && setActiveIdx(activeIdx + 1)}
              disabled={activeIdx === stops.length - 1}
              style={{
                background: 'none', border: 'none', fontSize: 22, color: MAROON,
                cursor: 'pointer', opacity: activeIdx === stops.length - 1 ? 0.3 : 1,
                lineHeight: 1, padding: '0 4px',
              }}
            >›</button>
            <button
              aria-label="Close"
              onClick={() => setPanelOpen(false)}
              style={{
                background: 'none', border: 'none', fontSize: 22, color: '#999',
                cursor: 'pointer', lineHeight: 1, padding: '0 4px', marginLeft: 4,
              }}
            >×</button>
          </div>
        </div>

        {/* Stop content */}
        {stop && (
          <div style={{ display: 'flex' }}>
            {stop.imageUrl && (
              <img
                src={stop.imageUrl}
                alt={stop.caption}
                style={{ width: 150, minWidth: 150, height: 150, objectFit: 'cover', display: 'block', flexShrink: 0 }}
              />
            )}
            <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: '0 0 8px',
                fontFamily: 'var(--playfair-display, Georgia, serif)',
                fontSize: '1.05rem', color: '#111', lineHeight: 1.25,
              }}>
                {stop.headline}
              </h3>
              <div
                style={{
                  fontFamily: 'var(--open-sans)', fontSize: '0.82rem',
                  color: '#444', lineHeight: 1.65,
                }}
                dangerouslySetInnerHTML={{ __html: stop.body }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
