import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'foreskills-theme';

/** @returns {'light' | 'dark'} */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

function applyTheme(/** @type {'light' | 'dark'} */ theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = theme;
}

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

const SESSION_STORAGE_KEY = 'foreskills-session';

/**
 * @typedef {Object} UserSession
 * @property {string} displayName
 * @property {string} role
 * @property {string} department
 * @property {string} dataAccess
 * @property {string} [full_name]
 * @property {boolean} [authenticated]
 * @property {string} [signInAt]
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {UserSession | null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoadingAuth
 * @property {boolean} isLoadingPublicSettings
 * @property {null} authError
 * @property {null} appPublicSettings
 * @property {boolean} authChecked
 * @property {boolean} isLocalSession
 * @property {() => void} logout
 */

const DEFAULT_SESSION = Object.freeze({
  displayName: 'Government Officer',
  role: 'State Official',
  department: 'Skill Development Department',
  dataAccess: 'Reference Dataset',
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

/** @param {UserSession | null} session */
function persistSession(session) {
  if (typeof window === 'undefined') return;
  try {
    if (session) window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // storage unavailable
  }
}

/** @returns {UserSession} */
function createDemoSession() {
  return {
    ...DEFAULT_SESSION,
    authenticated: true,
    signInAt: new Date().toISOString(),
  };
}

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @param {{ children: React.ReactNode }} props */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(/** @type {UserSession | null} */ () => {
    const stored = readStoredSession();
    if (stored && stored.authenticated) return { ...DEFAULT_SESSION, ...stored };
    return null;
  });

  useEffect(() => {
    setSession((current) => current || createDemoSession());
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  const value = useMemo(() => ({
    user: session,
    isAuthenticated: !!session?.authenticated,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    isLocalSession: true,
    logout() {
      // Clear local FORESKILLS session state. The device theme
      // preference is kept; no server session exists to invalidate.
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('foreskills-') && key !== THEME_STORAGE_KEY) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      }
      setSession(null);
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
