// ============================================================
// FORESKILLS — APPLICATION SHELL
// Consolidated layout components:
//   • Layout      — sidebar + topbar shell with mobile overlay
//   • Sidebar     — brand, section navigation, dataset note
//   • Topbar      — state/scope header with period picker
//   • ThemeToggle — light/dark switch
//   • OfficerMenu — session dropdown (auth context)
//   • ScrollToTop — route-change scroll restoration
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Radar, AlertTriangle, TrendingUp,
  FileText, Calculator, Wallet, GitCompare, Users, FileBarChart,
  X, ShieldCheck, Menu, MapPin, Clock, Database, ChevronDown,
  Sun, Moon, User, LogOut, KeyRound,
} from 'lucide-react';
import { REFERENCE_DATASET } from '@/data/data';
import { useTheme, useAuth } from '@/hooks/hooks';

// ------------------------------------------------------------
// SCROLL TO TOP
// ------------------------------------------------------------

/** @param {string} hash */
const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}

// ------------------------------------------------------------
// SIDEBAR
// ------------------------------------------------------------

const NAV = [
  { section: 'Overview', items: [
    { to: '/', label: 'Decision Center', icon: LayoutDashboard },
    { to: '/district', label: 'District Intelligence', icon: Map },
  ]},
  { section: 'Intelligence', items: [
    { to: '/skills', label: 'Skill Demand', icon: Radar },
    { to: '/economic-shocks', label: 'Economic Shocks', icon: AlertTriangle },
    { to: '/investments', label: 'Investments', icon: TrendingUp },
    { to: '/curriculum', label: 'Curriculum Intelligence', icon: FileText },
  ]},
  { section: 'Simulation', items: [
    { to: '/policy-simulator', label: 'Policy Simulator', icon: Calculator },
    { to: '/budget-optimizer', label: 'Budget Optimizer', icon: Wallet },
    { to: '/scenario-comparison', label: 'Scenario Comparison', icon: GitCompare },
    { to: '/digital-twin', label: 'Workforce Digital Twin', icon: Users },
  ]},
  { section: 'Outputs', items: [
    { to: '/reports', label: 'Reports', icon: FileBarChart },
  ]},
];

/** @param {{ onClose?: () => void }} props */
export function Sidebar({ onClose }) {
  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-base tracking-tight leading-none">FORESKILLS</h1>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1">Workforce Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground p-1" aria-label="Close navigation">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-1.5">
              {group.section}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border-l-2 border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — honest dataset note */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-muted/60 border border-border">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-info))] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground leading-none">Reference Dataset</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Connect a live source for production</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// THEME TOGGLE
// ------------------------------------------------------------

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

// ------------------------------------------------------------
// OFFICER MENU — functional dropdown.
// Uses real auth context. Where auth details are not yet provisioned,
// shows honest placeholders + a clear "future integration" note.
// ------------------------------------------------------------

export function OfficerMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null));
  const navigate = useNavigate();

  useEffect(() => {
    /** @param {MouseEvent} e */
    function handleClick(e) {
      if (ref.current && !ref.current.contains(/** @type {Node} */ (e.target))) setOpen(false);
    }
    /** @param {KeyboardEvent} e */
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const displayName = user?.full_name || (isAuthenticated ? 'Officer' : 'Government Officer');
  const role = user?.role === 'admin' ? 'State Official' : 'State Official';
  const initials = (displayName || 'GO')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-border bg-card hover:bg-accent/10 px-1.5 py-1 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-primary text-[11px] font-bold">{initials}</span>
        </span>
        <span className="hidden md:block text-left leading-tight">
          <span className="block text-xs font-medium text-foreground">{displayName}</span>
          <span className="block text-[10px] text-muted-foreground">{role}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground hidden md:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-3 border-b border-border bg-muted/50">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {isAuthenticated ? 'Signed in' : 'Authentication pending'}
            </p>
          </div>

          <div className="py-1">
            <MenuItem icon={User} label="Profile" onClick={() => { setOpen(false); }} />
            <MenuItem icon={ShieldCheck} label="Role" detail={role} onClick={() => { setOpen(false); }} />
            <MenuItem icon={Database} label="Data Access" detail="Reference Dataset" onClick={() => { setOpen(false); navigate('/reports'); }} />
          </div>

          <div className="py-1 border-t border-border">
            <MenuItem icon={LogOut} label="Sign Out" destructive onClick={handleSignOut} />
          </div>

          {!isAuthenticated && (
            <div className="px-3 py-2 border-t border-border bg-muted/40">
              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                SSO authentication is a future integration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {import('react').ComponentType<{ className?: string }>} props.icon
 * @param {string} props.label
 * @param {string} [props.detail]
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.destructive]
 */
function MenuItem({ icon: Icon, label, detail = '', onClick = () => {}, destructive = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors ${
        destructive ? 'text-[hsl(var(--status-high))]' : 'text-foreground'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
      <span className="flex-1">{label}</span>
      {detail && <span className="text-[10px] text-muted-foreground">{detail}</span>}
    </button>
  );
}

// ------------------------------------------------------------
// TOPBAR
// ------------------------------------------------------------

const PERIODS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'FY 2025-26'];

/** @param {{ onMenuClick: () => void }} props */
export function Topbar({ onMenuClick }) {
  const [period, setPeriod] = useState('Q2 2026');
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    /** @param {MouseEvent} e */
    function handleClick(e) {
      if (periodRef.current && !periodRef.current.contains(/** @type {Node} */ (e.target))) setPeriodOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14">
        {/* Left — state & scope */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground p-1" aria-label="Open navigation">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">Maharashtra</span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground hidden sm:inline">Skill Development Dept</span>
          </div>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-2">
          {/* Analysis Period */}
          <div className="relative hidden md:block" ref={periodRef}>
            <button
              type="button"
              onClick={() => setPeriodOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={periodOpen}
              className="flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-accent/10 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Analysis: {period}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
            </button>
            {periodOpen && (
              <div role="listbox" className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-50 py-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent/10 ${p === period ? 'text-primary font-medium' : 'text-foreground'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data Source status */}
          <div
            className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-muted/40 text-muted-foreground"
            title={REFERENCE_DATASET.note}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{REFERENCE_DATASET.label}</span>
          </div>

          <ThemeToggle />
          <OfficerMenu />
        </div>
      </div>
    </header>
  );
}

// ------------------------------------------------------------
// LAYOUT
// ------------------------------------------------------------

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
