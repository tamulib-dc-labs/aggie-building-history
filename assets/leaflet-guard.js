/*
 * Keep window.L pointing at the Leaflet instance that has markercluster.
 *
 * canopy-map.js bundles Leaflet + leaflet.markercluster and sets window.L.
 * Other Canopy chunks (e.g. canopy-shared-*.js pulled in by canopy-slider.js)
 * bundle a second copy of Leaflet, whose UMD wrapper unconditionally does
 * `window.L = exports`. markercluster's factory resolves the global `L` at
 * call time (`new L.MarkerClusterGroup(...)`), so if that second copy loads
 * before the map mounts, the map throws "L.MarkerClusterGroup is not a
 * constructor". Whether it happens depends on script load timing.
 *
 * Once window.L has MarkerClusterGroup, ignore assignments of a Leaflet that
 * doesn't.
 */
(function () {
  if (typeof window === "undefined") return;
  var current = window.L;
  try {
    Object.defineProperty(window, "L", {
      configurable: true,
      enumerable: true,
      get: function () {
        return current;
      },
      set: function (next) {
        if (current && current.MarkerClusterGroup && next && !next.MarkerClusterGroup) {
          return;
        }
        current = next;
      },
    });
  } catch (_) {}
})();
