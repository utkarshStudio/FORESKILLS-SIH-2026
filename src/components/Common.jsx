// ============================================================
// FORESKILLS — SHARED APPLICATION COMPONENTS
// Reusable building blocks used across all pages:
//   Panel, SectionCard, KPI, KPICard, PageHeader, RiskBadge,
//   DataSourceBadge, EvidencePanel, EmptyState,
//   ConfidenceIndicator, ErrorBoundary
// ============================================================

import React from 'react';
import {
  TrendingUp, AlertTriangle, Wallet, Users, ArrowRight,
  Inbox, Database, CheckCircle2, Info, Clock,
  RotateCcw,
} from 'lucide-react';
import { REFERENCE_DATASET } from '@/data/data';

// ------------------------------------------------------------
// PANEL — the workhorse container. Clean borders, minimal shadow,
// optional header with title / subtitle / action. No neon, no glass.
// ------------------------------------------------------------
/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {import('react').ReactNode} [props.action]
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.bodyClassName]
 * @param {boolean} [props.noBody]
 */
export function Panel({ title, subtitle, icon: Icon, action, children, className = '', bodyClassName = '', noBody = false }) {
  return (
    <section className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
      {(title || Icon) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </header>
      )}
      {!noBody && <div className={`p-4 ${bodyClassName}`}>{children}</div>}
      {noBody && children}
    </section>
  );
}

// Thin compatibility wrapper around Panel so existing page usage keeps working.
/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.subtitle]
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {boolean} [props.demo]
 * @param {import('react').ReactNode} [props.action]
 * @param {string} [props.className]
 */
export function SectionCard({ title, subtitle, icon: Icon, children, demo = false, action, className = '' }) {
  return (
    <Panel title={title} subtitle={subtitle} icon={Icon} action={action} className={className} data-demo={demo || undefined}>
      {children}
    </Panel>
  );
}

export default SectionCard;

// ------------------------------------------------------------
// KPI — single key metric. Clean, restrained, no decorative gradients.
// Supports an honest empty state (no value) for unavailable metrics.
// ------------------------------------------------------------
/**
 * @param {Object} props
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {string} props.label
 * @param {import('react').ReactNode} [props.value]
 * @param {string} [props.unit]
 * @param {string} [props.sublabel]
 * @param {'high'|'medium'|'low'} [props.status]
 * @param {number} [props.trend]
 * @param {boolean} [props.empty]
 * @param {string} [props.emptyNote]
 * @param {() => void} [props.onClick]
 */
export function KPI({ icon: Icon, label, value, unit, sublabel, status, trend, empty, emptyNote, onClick }) {
  const statusColor =
    status === 'high' ? 'text-[hsl(var(--status-high))]' :
    status === 'medium' ? 'text-[hsl(var(--status-medium))]' :
    status === 'low' ? 'text-[hsl(var(--status-low))]' :
    'text-foreground';

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
          {Icon && <Icon className="w-4 h-4 text-primary" aria-hidden="true" />}
        </span>
        {trend !== undefined && !empty && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-[hsl(var(--status-low))]' : 'text-[hsl(var(--status-high))]'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {empty ? (
        <>
          <p className="text-sm font-medium text-muted-foreground leading-none mb-1">Data unavailable</p>
          <p className="text-[11px] text-muted-foreground/80">{emptyNote || 'Connect a data source to view this metric.'}</p>
        </>
      ) : (
        <>
          <p className={`text-2xl font-bold leading-none mb-1 ${statusColor}`}>
            {value}
            {unit && <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sublabel && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sublabel}</p>}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// KPICard — legacy-compatible KPI card with semantic tone mapping
// ------------------------------------------------------------

/** @type {Record<string, import('lucide-react').LucideIcon>} */
const ICON_MAP = {
  gaps: TrendingUp,
  risk: AlertTriangle,
  investments: Wallet,
  training: Users,
  budget: Wallet,
  retention: ArrowRight,
};

// Map the legacy `color` prop to semantic status tokens so cards stay
// consistent across light/dark themes.
const COLOR_MAP = {
  red: { token: 'var(--status-high)', fallback: 'var(--destructive)' },
  amber: { token: 'var(--status-medium)', fallback: 'var(--status-medium)' },
  emerald: { token: 'var(--status-low)', fallback: 'var(--status-low)' },
  blue: { token: 'var(--status-info)', fallback: 'var(--primary)' },
  cyan: { token: 'var(--status-info)', fallback: 'var(--accent)' },
  violet: { token: 'var(--chart-5)', fallback: 'var(--chart-5)' },
};

/**
 * @param {Object} props
 * @param {string} [props.icon] - key into ICON_MAP
 * @param {'red'|'amber'|'emerald'|'blue'|'cyan'|'violet'} [props.color]
 * @param {string} props.label
 * @param {import('react').ReactNode} props.value
 * @param {string} [props.unit]
 * @param {string} [props.sublabel]
 * @param {number} [props.trend]
 * @param {() => void} [props.onClick]
 */
export function KPICard({ icon = 'gaps', color = 'blue', label, value, unit, sublabel, trend, onClick }) {
  const Icon = ICON_MAP[icon] || TrendingUp;
  const tone = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center border"
          style={{
            background: `hsl(${tone.token} / 0.10)`,
            borderColor: `hsl(${tone.token} / 0.20)`,
            color: `hsl(${tone.token})`,
          }}
        >
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-[hsl(var(--status-low))]' : 'text-[hsl(var(--status-high))]'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground leading-none mb-1">
        {value}{unit && <span className="text-base font-semibold text-muted-foreground ml-0.5">{unit}</span>}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/70 mt-1">{sublabel}</p>}
    </div>
  );
}

// ------------------------------------------------------------
// PageHeader — consistent page title block with optional controls.
// ------------------------------------------------------------
/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {import('react').ReactNode} [props.children]
 */
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

// ------------------------------------------------------------
// RiskBadge — status badge. Restrained, accessible. Uses semantic
// status tokens, never communicates through color alone (always
// includes a text label).
// ------------------------------------------------------------

/** @type {Record<string, { cls: string, dot: string }>} */
const LEVELS = {
  HIGH: { cls: 'bg-[hsl(var(--status-high))]/12 text-[hsl(var(--status-high))] border-[hsl(var(--status-high))]/25', dot: 'bg-[hsl(var(--status-high))]' },
  MEDIUM: { cls: 'bg-[hsl(var(--status-medium))]/12 text-[hsl(var(--status-medium))] border-[hsl(var(--status-medium))]/25', dot: 'bg-[hsl(var(--status-medium))]' },
  LOW: { cls: 'bg-[hsl(var(--status-low))]/12 text-[hsl(var(--status-low))] border-[hsl(var(--status-low))]/25', dot: 'bg-[hsl(var(--status-low))]' },
  POSITIVE: { cls: 'bg-[hsl(var(--status-info))]/12 text-[hsl(var(--status-info))] border-[hsl(var(--status-info))]/25', dot: 'bg-[hsl(var(--status-info))]' },
  ACTIVE: { cls: 'bg-[hsl(var(--status-info))]/12 text-[hsl(var(--status-info))] border-[hsl(var(--status-info))]/25', dot: 'bg-[hsl(var(--status-info))]' },
  PLANNED: { cls: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  NONE: { cls: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
};

/**
 * @param {{ level?: string, size?: 'xs'|'sm'|'md', className?: string }} props
 */
export function RiskBadge({ level = 'LOW', size = 'md', className = '' }) {
  const style = LEVELS[level] || LEVELS.LOW;
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'xs' ? 'text-[9px] px-1 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${style.cls} ${sizeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {level}
    </span>
  );
}

// ------------------------------------------------------------
// DataSourceBadge — honest indicator of what backs the numbers.
// Pass `source` for a specific connected source, or omit to show the
// reference dataset (the default simulation basis).
// ------------------------------------------------------------
/**
 * @param {Object} props
 * @param {{ connected?: boolean, label?: string, detail?: string }} [props.source]
 * @param {string} [props.label]
 * @param {boolean} [props.live]
 * @param {string} [props.className]
 */
export function DataSourceBadge({ source, label, live = false, className = '' }) {
  const isLive = live || Boolean(source?.connected);
  const text = label || (isLive ? (source?.label || 'Live Source') : REFERENCE_DATASET.label);

  return (
    <span
      title={isLive ? `Connected: ${source?.detail || text}` : REFERENCE_DATASET.note}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${
        isLive
          ? 'border-[hsl(var(--status-low))]/30 bg-[hsl(var(--status-low))]/10 text-[hsl(var(--status-low))]'
          : 'border-border bg-muted text-muted-foreground'
      } ${className}`}
    >
      {isLive ? <CheckCircle2 className="w-3 h-3" /> : <Database className="w-3 h-3" />}
      {text}
    </span>
  );
}

// ------------------------------------------------------------
// EvidencePanel — confidence, evidence bullets, method and timestamp.
// ------------------------------------------------------------

/**
 * @param {Object} props
 * @param {number} [props.confidence]
 * @param {string[]} [props.evidence]
 * @param {string} [props.method]
 * @param {string} [props.dataSource]
 * @param {string} [props.timestamp]
 */
export function EvidencePanel({ confidence, evidence = [], method, dataSource = 'Reference dataset', timestamp }) {
  return (
    <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">Evidence & Method</span>
        </div>
        <DataSourceBadge label={dataSource} />
      </div>

      {confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-low))]" />
          <span className="text-muted-foreground">Confidence:</span>
          <span className="text-foreground font-medium">{confidence}%</span>
        </div>
      )}

      {evidence.length > 0 && (
        <div className="space-y-1">
          {evidence.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      {method && (
        <div className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{method}</p>
        </div>
      )}

      {timestamp && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          <span>{timestamp}</span>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// EmptyState — honest placeholder for unavailable data.
// Never fills space with fabricated numbers.
// ------------------------------------------------------------

/**
 * @param {Object} props
 * @param {import('react').ComponentType<{ className?: string }>} [props.icon]
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 * @param {boolean} [props.compact]
 * @param {string} [props.className]
 */
export function EmptyState({ icon: Icon = Inbox, title = 'No data available', description, action, compact = false, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-12'} px-4 ${className}`}>
      <span className={`flex items-center justify-center rounded-full bg-muted border border-border ${compact ? 'w-10 h-10' : 'w-14 h-14'} mb-3`}>
        <Icon className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} text-muted-foreground`} aria-hidden="true" />
      </span>
      <p className={`font-medium text-foreground ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ------------------------------------------------------------
// ConfidenceIndicator — horizontal confidence meter.
// ------------------------------------------------------------

export function ConfidenceIndicator({ value = 75, label = 'Confidence' }) {
  const color = value >= 80 ? 'text-[hsl(var(--status-low))]' : value >= 60 ? 'text-[hsl(var(--status-medium))]' : 'text-[hsl(var(--status-high))]';
  const bgColor = value >= 80 ? 'bg-[hsl(var(--status-low))]' : value >= 60 ? 'bg-[hsl(var(--status-medium))]' : 'bg-[hsl(var(--status-high))]';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div className={`h-full ${bgColor} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-medium ${color}`}>{value}%</span>
    </div>
  );
}

// ------------------------------------------------------------
// ErrorBoundary — contains rendering failures so one broken panel,
// chart or page section never takes down the whole application.
// ------------------------------------------------------------

/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {string} [title]
 * @property {boolean} [compact]
 * @property {import('react').ReactNode} [children]
 */

/** @extends React.Component<ErrorBoundaryProps, { hasError: boolean, error: Error | null }> */
export class ErrorBoundary extends React.Component {
  /** @param {ErrorBoundaryProps} props */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** @param {Error} error */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /** @param {Error} error */
  componentDidCatch(error) {
    // Keep console output minimal and useful for debugging.
    if (import.meta.env.DEV) {
      console.error('[FORESKILLS] Render error contained by ErrorBoundary:', error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { title = 'This view could not be rendered', compact = false } = this.props;
      if (compact) {
        return (
          <div className="p-4 rounded-lg border border-[hsl(var(--status-high))]/30 bg-[hsl(var(--status-high))]/5 text-center">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-high))] mx-auto mb-1.5" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
        );
      }
      return (
        <div className="p-8 rounded-lg border border-border bg-card text-center">
          <span className="w-12 h-12 rounded-full bg-[hsl(var(--status-high))]/10 border border-[hsl(var(--status-high))]/20 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-[hsl(var(--status-high))]" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            An unexpected error occurred while displaying this section. The rest of the application is still available.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
