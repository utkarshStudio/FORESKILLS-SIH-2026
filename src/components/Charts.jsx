// ============================================================
// FORESKILLS — CHART HELPERS
// Theme-aware styling primitives for recharts. Previously
// src/lib/chartTheme.js.
// ============================================================

import { useState, useEffect } from 'react';

/**
 * Reads a CSS custom property (HSL channels like "212 72% 33%") and
 * returns a usable hsl(...) color string. Falls back gracefully when
 * the variable is missing.
 */
/** @param {string} name */
function readVar(name) {
  if (typeof window === 'undefined') return '';
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v;
}

/** @param {string} token */
function hsl(token) {
  const v = readVar(token);
  return v ? `hsl(${v})` : '';
}

/**
 * @param {string} token
 * @param {number} alpha
 */
function hslAlpha(token, alpha) {
  const v = readVar(token);
  return v ? `hsl(${v} / ${alpha})` : '';
}

/**
 * useChartTheme — returns theme-aware recharts style primitives.
 * Re-renders when the theme toggles between light and dark.
 */
export function useChartTheme() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return {
    dark,
    tooltipStyle: {
      background: hsl('--popover'),
      border: `1px solid ${hslAlpha('--border', 1)}`,
      borderRadius: '8px',
      fontSize: '12px',
      color: hsl('--popover-foreground'),
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    itemStyle: { color: hsl('--foreground') },
    labelStyle: { color: hsl('--muted-foreground') },
    tickFill: hsl('--muted-foreground'),
    gridStroke: hslAlpha('--border', 0.6),
    colors: {
      demand: hsl('--chart-1'),
      supply: hsl('--chart-4'),
      gap: hsl('--status-high'),
      primary: hsl('--primary'),
      accent: hsl('--chart-2'),
      series: [hsl('--chart-1'), hsl('--chart-2'), hsl('--chart-3'), hsl('--chart-4'), hsl('--chart-5')],
    },
  };
}
