// ============================================================
// FORESKILLS — MAP COMPONENTS
// District map visualization for Maharashtra (previously
// src/components/MaharashtraMap.jsx). Real MapLibre GL map on a
// lightweight CARTO raster basemap, real Maharashtra district
// boundaries (DataMeet / LGD, CC BY 4.0), metric coloring, hover
// tooltip, click-to-select, zoom controls and legend.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  AttributionControl,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { DISTRICTS } from '@/data/data';
import { calculateDistrictSkillGaps, calculateRisk } from '@/engines/engines';
import { RiskBadge } from './Common';

// MapLibre resolves its bundled worker relative to import.meta.url,
// which points into Vite's optimized-deps chunk during development.
// Point it at the real worker module served by Vite instead, so the
// worker loads correctly in both dev and production builds.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
setWorkerUrl(/** @type {string} */ (maplibreWorkerUrl));

// Lightweight basemap: CARTO raster tiles (light_all / dark_all,
// keyless, free for non-commercial use) referenced from an inline GL
// style. Raster tiles replace the previous heavy Positron/Dark Matter
// *vector* styles — one small 256px PNG per tile cell instead of a
// style JSON plus dozens of vector layers, sprites and glyph/font
// fetches — so first paint is fast and data usage stays low. Tile
// loads are capped at zoom 12; deeper zooming reuses (upscaled) tiles.
const BASMAP_TILE_URLS = {
  light: [
    'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  ],
  dark: [
    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  ],
};

/** Max tile zoom fetched from the basemap source (overzoom beyond). */
const BASEMAP_MAXZOOM = 12;

/**
 * Builds the minimal inline basemap style (theme-aware) around the
 * raster tile source.
 * @param {boolean} isDark
 * @returns {any}
 */
function getBasemapStyle(isDark) {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: isDark ? BASMAP_TILE_URLS.dark : BASMAP_TILE_URLS.light,
        tileSize: 256,
        minzoom: 0,
        maxzoom: BASEMAP_MAXZOOM,
        attribution: '© OpenStreetMap contributors © CARTO',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': isDark ? 'hsl(222, 26%, 10%)' : 'hsl(220, 26%, 96%)' },
      },
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
        paint: { 'raster-fade-duration': 0 },
      },
    ],
  };
}

const HOME_VIEW = { center: /** @type {[number, number]} */ ([75.9, 19.3]), zoom: 5.55 };

const DISTRICT_DATA_URL = `${import.meta.env.BASE_URL}maharashtra-districts.geojson`;

/**
 * Maps GeoJSON `dtname` values (Census 2011 / LGD names) to app
 * district ids. "Mumbai" covers both Mumbai City and Mumbai
 * Suburban; "Aurangabad" is the official former name of Chhatrapati
 * Sambhajinagar district.
 * @type {Record<string, string>}
 */
const GEOJSON_NAME_TO_DISTRICT_ID = {
  Nashik: 'nashik',
  Pune: 'pune',
  Nagpur: 'nagpur',
  Mumbai: 'mumbai',
  'Mumbai Suburban': 'mumbai',
  Thane: 'thane',
  Kolhapur: 'kolhapur',
  Aurangabad: 'csambhajinagar',
};

/** Concrete HSL values mirroring --status-* CSS variables per theme (MapLibre paint props cannot resolve CSS vars). */
const MAP_PALETTE = {
  light: {
    high: 'hsl(0, 68%, 45%)',
    medium: 'hsl(32, 85%, 45%)',
    low: 'hsl(142, 52%, 38%)',
    info: 'hsl(212, 72%, 40%)',
    none: 'hsl(220, 10%, 42%)',
    outline: 'hsl(220, 14%, 66%)',
    hover: 'hsl(222, 47%, 30%)',
    selected: 'hsl(222, 47%, 22%)',
  },
  dark: {
    high: 'hsl(0, 68%, 58%)',
    medium: 'hsl(32, 85%, 58%)',
    low: 'hsl(142, 52%, 55%)',
    info: 'hsl(200, 70%, 58%)',
    none: 'hsl(220, 12%, 62%)',
    outline: 'hsl(222, 12%, 46%)',
    hover: 'hsl(210, 90%, 72%)',
    selected: 'hsl(210, 90%, 78%)',
  },
};

const SOURCE_ID = 'mh-districts';
const LAYER_FILL = 'districts-fill';
const LAYER_OUTLINE = 'districts-outline';
const LAYER_HOVER = 'districts-hoverline';
const LAYER_SELECTED = 'districts-selected';

/**
 * @typedef {Object} MapMetricConfig
 * @property {string} label
 * @property {(val: number) => string} getColor
 * @property {(val: number) => string} getLevel
 */

/** @type {Record<'risk'|'gap'|'investment', MapMetricConfig>} */
const METRIC_CONFIG = {
  risk: {
    label: 'Workforce Risk',
    getColor: (val) => val >= 60 ? 'hsl(var(--status-high))' : val >= 35 ? 'hsl(var(--status-medium))' : 'hsl(var(--status-low))',
    getLevel: (val) => val >= 60 ? 'HIGH' : val >= 35 ? 'MEDIUM' : 'LOW',
  },
  gap: {
    label: 'Skill Gap',
    getColor: (val) => val >= 40 ? 'hsl(var(--status-high))' : val >= 20 ? 'hsl(var(--status-medium))' : 'hsl(var(--status-low))',
    getLevel: (val) => val >= 40 ? 'HIGH' : val >= 20 ? 'MEDIUM' : 'LOW',
  },
  investment: {
    label: 'Investment Activity',
    getColor: (val) => val > 0 ? 'hsl(var(--status-info))' : 'hsl(var(--muted-foreground))',
    getLevel: (val) => val > 0 ? 'ACTIVE' : 'NONE',
  },
};

/** @typedef {typeof DISTRICTS[number]} District */

/**
 * @param {District} district
 * @param {'risk'|'gap'|'investment'} metric
 * @returns {number}
 */
function computeDistrictValue(district, metric) {
  if (metric === 'risk') {
    const risks = district.major_industry_ids.map(indId => calculateRisk(district.id, indId)?.risk_score || 0);
    return Math.max(...risks);
  }
  if (metric === 'gap') {
    const gaps = calculateDistrictSkillGaps(district.id);
    return gaps.length ? gaps.reduce((s, g) => s + (/** @type {number} */ (g?.gap) || 0), 0) / gaps.length : 0;
  }
  if (metric === 'investment') {
    return district.major_industry_ids.length;
  }
  return 0;
}

/**
 * Concrete color for MapLibre paint expressions — thresholds mirror
 * METRIC_CONFIG exactly.
 * @param {number} val
 * @param {'risk'|'gap'|'investment'} metric
 * @param {typeof MAP_PALETTE.light} palette
 * @returns {string}
 */
function concreteColor(val, metric, palette) {
  if (metric === 'risk') {
    return val >= 60 ? palette.high : val >= 35 ? palette.medium : palette.low;
  }
  if (metric === 'gap') {
    return val >= 40 ? palette.high : val >= 20 ? palette.medium : palette.low;
  }
  if (metric === 'investment') {
    return val > 0 ? palette.info : palette.none;
  }
  return palette.none;
}

/**
 * Recursively collects [lng, lat] pairs from any GeoJSON geometry.
 * @param {unknown} geometryCoords
 * @param {[number, number][]} out
 */
function collectPositions(geometryCoords, out) {
  if (!Array.isArray(geometryCoords)) return;
  if (geometryCoords.length >= 2 && typeof geometryCoords[0] === 'number' && typeof geometryCoords[1] === 'number') {
    out.push([/** @type {number} */ (geometryCoords[0]), /** @type {number} */ (geometryCoords[1])]);
    return;
  }
  for (const nested of /** @type {unknown[]} */ (geometryCoords)) {
    collectPositions(nested, out);
  }
}

let districtGeoJSONPromise = /** @type {Promise<any> | null} */ (null);

/** Fetches (once) the real Maharashtra district boundaries used by every map instance. @returns {Promise<any>} */
function loadDistrictGeoJSON() {
  if (!districtGeoJSONPromise) {
    districtGeoJSONPromise = fetch(DISTRICT_DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`District GeoJSON HTTP ${response.status}`);
      return response.json();
    });
  }
  return districtGeoJSONPromise;
}

/**
 * Computes the bounding box [[minLng,minLat],[maxLng,maxLat]] of a
 * FeatureCollection using its real coordinates.
 * @param {any} geojson
 * @returns {[number, number][] | null}
 */
function computeBBox(geojson) {
  /** @type {[number, number][]} */
  const positions = [];
  for (const feature of geojson?.features ?? []) {
    collectPositions(feature?.geometry?.coordinates, positions);
  }
  if (!positions.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of positions) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Adds the district GeoJSON source + layers to a style (idempotent).
 * @param {import('maplibre-gl').MapLibreMap} map
 */
function ensureDistrictLayers(map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: DISTRICT_DATA_URL,
      promoteId: 'OBJECTID',
    });
  }

  const styleLayers = map.getStyle()?.layers ?? [];
  const firstSymbolLayer = styleLayers.find((layer) => layer.type === 'symbol');
  if (!map.getLayer(LAYER_FILL)) {
    map.addLayer(
      {
        id: LAYER_FILL,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#94a3b8',
          'fill-opacity': 0.5,
        },
      },
      firstSymbolLayer?.id
    );
  }

  if (!map.getLayer(LAYER_OUTLINE)) {
    map.addLayer(
      {
        id: LAYER_OUTLINE,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 0.9,
        },
      },
      firstSymbolLayer?.id
    );
  }

  if (!map.getLayer(LAYER_HOVER)) {
    map.addLayer(
      {
        id: LAYER_HOVER,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.4, 0],
        },
      },
      firstSymbolLayer?.id
    );
  }

  if (!map.getLayer(LAYER_SELECTED)) {
    map.addLayer(
      {
        id: LAYER_SELECTED,
        type: 'line',
        source: SOURCE_ID,
        filter: ['in', ['get', 'dtname'], ['literal', []]],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': 2.6,
        },
      },
      firstSymbolLayer?.id
    );
  }
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/**
 * @param {Object} props
 * @param {'risk'|'gap'|'investment'} [props.metric]
 * @param {(districtId: string) => void} [props.onDistrictClick]
 * @param {string|null} [props.selectedDistrictId]
 * @param {number} [props.height]
 */
export default function MaharashtraMap({ metric = 'risk', onDistrictClick, selectedDistrictId, height = 380 }) {
  const isDark = useIsDarkMode();
  const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
  const wrapRef = useRef(/** @type {HTMLDivElement|null} */ (null));
  const mapRef = useRef(/** @type {import('maplibre-gl').MapLibreMap|null} */ (null));
  const loadedRef = useRef(false);
  const styleIsDarkRef = useRef(isDark);
  const hoveredFeatureRef = useRef(/** @type {string|number|null} */ (null));

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(/** @type {string | null} */ (null));
  const [hovered, setHovered] = useState(/** @type {District | null} */ (null));
  const [tipPos, setTipPos] = useState(/** @type {{x: number, y: number} | null} */ (null));
  const [isFullscreen, setIsFullscreen] = useState(false);

  const metricRef = useRef(metric);
  const onDistrictClickRef = useRef(onDistrictClick);
  const selectedRef = useRef(selectedDistrictId);
  const isDarkRef = useRef(isDark);
  metricRef.current = metric;
  onDistrictClickRef.current = onDistrictClick;
  selectedRef.current = selectedDistrictId;
  isDarkRef.current = isDark;

  const config = METRIC_CONFIG[metric] || METRIC_CONFIG.risk;

  /**
   * Re-applies metric coloring + selection styling from current refs.
   * @param {import('maplibre-gl').MapLibreMap} map
   */
  const refreshPaint = (map) => {
    const palette = isDarkRef.current ? MAP_PALETTE.dark : MAP_PALETTE.light;
    const activeMetric = metricRef.current;

    const fillColorExpr = /** @type {unknown[]} */ (['match', ['get', 'dtname']]);
    const fillOpacityExpr = /** @type {unknown[]} */ (['match', ['get', 'dtname']]);
    for (const district of DISTRICTS) {
      const value = computeDistrictValue(district, activeMetric);
      fillColorExpr.push(district.name, concreteColor(value, activeMetric, palette));
      fillOpacityExpr.push(district.name, 0.82);
    }
    fillColorExpr.push(palette.none);
    fillOpacityExpr.push(0.25);

    if (map.getLayer(LAYER_FILL)) {
      map.setPaintProperty(LAYER_FILL, 'fill-color', /** @type {any} */ (fillColorExpr));
      map.setPaintProperty(LAYER_FILL, 'fill-opacity', /** @type {any} */ (fillOpacityExpr));
    }
    if (map.getLayer(LAYER_OUTLINE)) {
      map.setPaintProperty(LAYER_OUTLINE, 'line-color', palette.outline);
    }
    if (map.getLayer(LAYER_HOVER)) {
      map.setPaintProperty(LAYER_HOVER, 'line-color', palette.hover);
    }
    applySelectionPaint(map);
  };

  /**
   * @param {import('maplibre-gl').MapLibreMap} map
   */
  const applySelectionPaint = (map) => {
    const selectedNames = Object.entries(GEOJSON_NAME_TO_DISTRICT_ID)
      .filter(([, id]) => id === selectedRef.current)
      .map(([name]) => name);
    if (map.getLayer(LAYER_SELECTED)) {
      const palette = isDarkRef.current ? MAP_PALETTE.dark : MAP_PALETTE.light;
      map.setFilter(LAYER_SELECTED, ['in', ['get', 'dtname'], ['literal', selectedNames]]);
      map.setPaintProperty(LAYER_SELECTED, 'line-color', palette.selected);
    }
  };

  // Initialize the MapLibre map once.
  useEffect(() => {
    // React StrictMode intentionally runs mount -> cleanup -> mount.
    // Creating the GL map synchronously would let the first (throwaway)
    // mount poison MapLibre's global worker pool for the second map
    // (terminated workers get reused), leaving style loading stalled
    // forever. Deferring creation by a tick means only the surviving
    // mount ever constructs a map.
    /** @type {number | undefined} */
    let creationTimer;
    /** @type {boolean} */
    let disposed = false;

    const createMap = () => {
      if (disposed || !containerRef.current || mapRef.current) return;

      // Kick off the boundary fetch immediately; reused across mounts.
      const geoJSONPromise = loadDistrictGeoJSON();

      console.debug('[FORESKILLS MAP] MapLibre initialized');
      if (disposed || !containerRef.current || mapRef.current) return;
      const map = new MapLibreMap({
        container: containerRef.current,
        style: getBasemapStyle(styleIsDarkRef.current),
        center: HOME_VIEW.center,
        zoom: HOME_VIEW.zoom,
        attributionControl: false,
        fadeDuration: 0,
      });
      map.addControl(
        new AttributionControl({
          compact: true,
          // OSM/CARTO credits are picked up automatically from the
          // raster source's `attribution` field.
          customAttribution: 'District boundaries © DataMeet India / LGD (CC BY 4.0)',
        }),
        'bottom-right'
      );

      // Watchdog: never leave the UI stuck on "Loading map…" silently.
      const watchdog = window.setTimeout(() => {
        if (!loadedRef.current) {
          setMapError('Map tiles did not finish loading. Check your network connection and reload.');
        }
      }, 15000);

      map.on('error', (event) => {
        console.error('FORESKILLS MapLibre error:', event);
        const message = String(/** @type {any} */ (event)?.error?.message ?? '');
        if (!loadedRef.current && /worker/i.test(message)) {
          setMapError(`Map worker failed to start: ${message}`);
        }
      });

      /**
       * Re-adds layers after a style swap, keeping current refs authoritative.
       * @param {import('maplibre-gl').MapLibreMap} targetMap
       */
      const syncStyleThenRefresh = (targetMap) => {
        if (styleIsDarkRef.current !== isDarkRef.current) {
          styleIsDarkRef.current = isDarkRef.current;
          targetMap.once('styledata', () => {
            ensureDistrictLayers(targetMap);
            refreshPaint(targetMap);
          });
          targetMap.setStyle(getBasemapStyle(isDarkRef.current));
        } else {
          ensureDistrictLayers(targetMap);
          refreshPaint(targetMap);
        }
      };

      map.on('load', () => {
        console.debug('[FORESKILLS MAP] MapLibre loaded');
        loadedRef.current = true;
        window.clearTimeout(watchdog);
        setMapError(null);

        syncStyleThenRefresh(map);

        geoJSONPromise
          .then((geojson) => {
            console.debug('[FORESKILLS MAP] District GeoJSON loaded', {
              districts: geojson?.features?.length ?? 0,
            });
            const bounds = computeBBox(geojson);
            if (bounds && map.getSource(SOURCE_ID)) {
              map.fitBounds(/** @type {any} */ (bounds), {
                padding: 24,
                duration: 0,
                maxZoom: HOME_VIEW.zoom + 0.5,
              });
            }
            console.debug('[FORESKILLS MAP] District layers added');
            setMapLoaded(true);
          })
          .catch((err) => {
            console.error('FORESKILLS MapLibre error:', err);
            setMapLoaded(true);
            setMapError(`District boundaries failed to load: ${String(err?.message ?? err)}`);
          });
      });

      map.on('mousemove', LAYER_FILL, (e) => {
        const feature = e.features?.[0];
        if (!feature || (typeof feature.id !== 'string' && typeof feature.id !== 'number')) return;
        if (hoveredFeatureRef.current !== null && hoveredFeatureRef.current !== feature.id) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureRef.current }, { hover: false });
        }
        hoveredFeatureRef.current = feature.id;
        map.setFeatureState({ source: SOURCE_ID, id: feature.id }, { hover: true });

        const dtname = /** @type {string|undefined} */ (feature.properties?.dtname);
        const districtId = dtname ? GEOJSON_NAME_TO_DISTRICT_ID[dtname] : undefined;
        setHovered(districtId ? DISTRICTS.find((d) => d.id === districtId) ?? null : null);
        setTipPos({ x: e.point.x, y: e.point.y });
        map.getCanvas().style.cursor = districtId ? 'pointer' : '';
      });

      map.on('mouseleave', LAYER_FILL, () => {
        if (hoveredFeatureRef.current !== null) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureRef.current }, { hover: false });
          hoveredFeatureRef.current = null;
        }
        setHovered(null);
        setTipPos(null);
        map.getCanvas().style.cursor = '';
      });

      map.on('click', LAYER_FILL, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const dtname = /** @type {string|undefined} */ (feature.properties?.dtname);
        const districtId = dtname ? GEOJSON_NAME_TO_DISTRICT_ID[dtname] : undefined;
        if (districtId && onDistrictClickRef.current) {
          onDistrictClickRef.current(districtId);
        }
      });

      mapRef.current = map;

      // Debug affordance for local troubleshooting (stripped from production builds).
      if (import.meta.env.DEV) {
        /** @type {any} */ (window).__fsMap = map;
      }
    };

    creationTimer = window.setTimeout(createMap, 0);

    return () => {
      disposed = true;
      window.clearTimeout(creationTimer);
      const map = mapRef.current;
      if (map) {
        map.remove();
        mapRef.current = null;
        loadedRef.current = false;
        hoveredFeatureRef.current = null;
        if (import.meta.env.DEV && /** @type {any} */ (window).__fsMap === map) {
          delete /** @type {any} */ (window).__fsMap;
        }
      }
      setMapLoaded(false);
      setHovered(null);
      setTipPos(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap basemap style when theme changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (styleIsDarkRef.current === isDark) return;
    styleIsDarkRef.current = isDark;
    map.once('styledata', () => {
      ensureDistrictLayers(map);
      refreshPaint(map);
    });
    map.setStyle(getBasemapStyle(isDark));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // Repaint when the metric changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (map.getLayer(LAYER_FILL)) refreshPaint(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);

  // Repaint when the selected district changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (map.getLayer(LAYER_SELECTED)) applySelectionPaint(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictId]);

  // Track native fullscreen (including Esc-key exits) and resize MapLibre
  // whenever the wrapper dimensions change.
  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === wrapRef.current;
      setIsFullscreen(active);
      // Canvas size changes with the container — let layout settle first,
      // then re-measure twice for safety.
      [0, 150].forEach((delay) => setTimeout(() => mapRef.current?.resize(), delay));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrap.requestFullscreen();
      }
    } catch {
      // Native Fullscreen unavailable (e.g. sandboxed iframe) — fall back
      // to a fixed-position CSS fullscreen of the same wrapper.
      setIsFullscreen((prev) => !prev);
      setTimeout(() => mapRef.current?.resize(), 0);
      setTimeout(() => mapRef.current?.resize(), 150);
    }
  };

  const legend = metric === 'risk' || metric === 'gap'
    ? [
        { color: 'hsl(var(--status-low))', label: 'Low' },
        { color: 'hsl(var(--status-medium))', label: 'Medium' },
        { color: 'hsl(var(--status-high))', label: 'High' },
      ]
    : [
        { color: 'hsl(var(--status-info))', label: 'Active' },
        { color: 'hsl(var(--muted-foreground))', label: 'None' },
      ];

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-md border border-border bg-muted/20 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none border-0 bg-background' : ''
      }`}
      style={isFullscreen ? undefined : { height }}
    >
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button onClick={() => mapRef.current?.zoomIn()} className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent/10 text-muted-foreground hover:text-foreground" aria-label="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent/10 text-muted-foreground hover:text-foreground" aria-label="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => mapRef.current?.easeTo({ center: HOME_VIEW.center, zoom: HOME_VIEW.zoom, duration: 300 })} className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent/10 text-muted-foreground hover:text-foreground" aria-label="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-accent/10 text-muted-foreground hover:text-foreground"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          aria-pressed={isFullscreen}
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'View fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* MapLibre canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[400px] absolute inset-0" />

      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-background/60 pointer-events-none">
          <span className="text-[11px] text-muted-foreground">Loading map…</span>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-x-6 top-1/2 z-[5] -translate-y-1/2 pointer-events-none">
          <div className="mx-auto max-w-sm rounded-md border border-destructive/30 bg-card/95 px-3 py-2 text-center shadow-lg">
            <p className="text-xs font-medium text-destructive">{mapError}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Basemap tiles require an internet connection.</p>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hovered && tipPos && (
        <div
          className="absolute bg-popover border border-border rounded-md p-2.5 shadow-lg pointer-events-none z-20"
          style={{
            left: `${tipPos.x}px`,
            top: `${tipPos.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <p className="text-xs font-semibold text-foreground">{hovered.name}</p>
          <p className="text-[10px] text-muted-foreground">{hovered.region}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{config.label}:</span>
            <RiskBadge level={config.getLevel(computeDistrictValue(hovered, metric))} size="sm" />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">{config.label}</span>
        <div className="flex items-center gap-2.5">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
