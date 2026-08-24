// ============================================================
// FORESKILLS — SHARED HOOKS & CONTEXTS
// Small application-wide React hooks consolidated in one module:
//   • useTheme      — light/dark theme with localStorage persistence
//   • AuthProvider / useAuth — local session context (no backend auth yet)
//   • useIsMobile   — responsive breakpoint flag
//   • useSize       — element size measurement via ResizeObserver
// ============================================================

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

// ------------------------------------------------------------
// THEME
// ------------------------------------------------------------

const THEME_STORAGE_KEY = 'foreskills-theme';

/** @returns {'light' | 'dark'} */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Default to light for a professional government interface
  return 'light';
}

function applyTheme(/** @type {'light' | 'dark'} */ theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = theme;
}

// Apply once on module load to prevent flash
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, setTheme, toggle };
}

// ------------------------------------------------------------
// LOCAL SESSION CONTEXT
// FORESKILLS runs without a backend authentication service.
// Authentication (SSO) is a future integration — until then this
// context provides a stable local session shape for the UI and
// clearly reports that auth is not connected. No network calls,
// no vendor SDK, no secrets.
// ------------------------------------------------------------

const SESSION_STORAGE_KEY = 'foreskills-session';

/**
 * @typedef {Object} UserSession
 * @property {string} displayName
 * @property {string} role
 * @property {string} department
 * @property {string} dataAccess
 * @property {string} [full_name]
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {UserSession} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoadingAuth
 * @property {boolean} isLoadingPublicSettings
 * @property {null} authError
 * @property {null} appPublicSettings
 * @property {boolean} authChecked
 * @property {boolean} isLocalSession
 * @property {() => void} logout
 */

// Current operating role for this workstation. Replace when SSO lands.
const DEFAULT_SESSION = Object.freeze({
  displayName: 'Government Officer',
  role: 'Government Officer',
  department: 'Skill Development Department',
  dataAccess: 'Reference dataset (read-only)',
});

/** @returns {Partial<UserSession> | null} */
function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @param {{ children: React.ReactNode }} props */
export function AuthProvider({ children }) {
  /** @type {UserSession} */
  const session = useMemo(() => {
    const stored = readStoredSession();
    return { ...DEFAULT_SESSION, ...(stored || {}) };
  }, []);

  const value = useMemo(() => ({
    // Shape kept compatible with existing consumers.
    user: session,
    isAuthenticated: false, // no auth service connected yet
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    isLocalSession: true,
    logout() {
      // Clear any local FORESKILLS state (no server session exists yet).
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('foreskills-')) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      }
    },
  }), [session]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ------------------------------------------------------------
// RESPONSIVE BREAKPOINT
// ------------------------------------------------------------

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(/** @type {boolean | undefined} */ (undefined));

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// ------------------------------------------------------------
// ELEMENT SIZE MEASUREMENT
// ------------------------------------------------------------

/**
 * @typedef {{ width: number, height: number }} Size
 * @param {{ current: HTMLElement | null }} ref
 * @returns {Size | null}
 */
export function useSize(ref) {
  const [size, setSize] = useState(/** @type {Size | null} */ (null));

  // useLayoutEffect (not useEffect): the initial measurement must land before
  // the browser paints, so consumers can render their real content on the
  // very first painted frame instead of a guess. A ResizeObserver's first
  // callback arrives too late for that — by then an <img> src guess has
  // already been dispatched to the network.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
