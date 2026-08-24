import React, { useState, useMemo } from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown } from 'lucide-react';
import { getAllRisks, calculateRisk } from '@/engines/engines';
import { SectionCard, RiskBadge, DataSourceBadge, EvidencePanel } from '@/components/Common';

export default function EconomicShocks() {
  const [selectedRisk, setSelectedRisk] = useState(/** @type {NonNullable<ReturnType<typeof calculateRisk>> | null} */ (null));
  const allRisks = useMemo(() => getAllRisks(), []);

  const highRisks = allRisks.filter(r => r.risk_level === 'HIGH');
  const mediumRisks = allRisks.filter(r => r.risk_level === 'MEDIUM');

  const displayRisk = selectedRisk || allRisks[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Economic Shock Predictor
          </h1>
          <p className="text-sm text-muted-foreground">Early-warning workforce risk forecast — estimated exposure, not layoff predictions</p>
        </div>
        <DataSourceBadge />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-[hsl(var(--status-high))]/10 border border-[hsl(var(--status-high))]/20">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-[hsl(var(--status-high))]" />
            <span className="text-xs text-[hsl(var(--status-high))] font-medium uppercase">High Risk</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{highRisks.length}</p>
          <p className="text-xs text-muted-foreground">district-industry pairs</p>
        </div>
        <div className="p-4 rounded-lg bg-[hsl(var(--status-medium))]/10 border border-[hsl(var(--status-medium))]/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-medium))]" />
            <span className="text-xs text-[hsl(var(--status-medium))] font-medium uppercase">Medium Risk</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{mediumRisks.length}</p>
          <p className="text-xs text-muted-foreground">district-industry pairs</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase">Total Assessed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{allRisks.length}</p>
          <p className="text-xs text-muted-foreground">risk assessments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk List */}
        <div className="lg:col-span-1">
          <SectionCard title="Risk Alerts" subtitle="Sorted by risk score" icon={AlertTriangle} demo>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {allRisks.map((risk, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedRisk(risk)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    displayRisk === risk ? 'bg-primary/5 border-primary/40' : 'bg-secondary/30 border-border hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-medium text-foreground">{risk.industry_name}</p>
                    <RiskBadge level={risk.risk_level} size="sm" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{risk.district_name} · Score: {risk.risk_score}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Risk Detail */}
        <div className="lg:col-span-2 space-y-4">
          {displayRisk && (
            <>
              <SectionCard title="Risk Assessment" subtitle={`${displayRisk.district_name} · ${displayRisk.industry_name}`} icon={ShieldAlert} demo>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Risk Score</p>
                    <p className={`text-2xl font-bold ${displayRisk.risk_level === 'HIGH' ? 'text-[hsl(var(--status-high))]' : displayRisk.risk_level === 'MEDIUM' ? 'text-[hsl(var(--status-medium))]' : 'text-[hsl(var(--status-low))]'}`}>
                      {displayRisk.risk_score}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Risk Level</p>
                    <div className="mt-1"><RiskBadge level={displayRisk.risk_level} /></div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Forecast Horizon</p>
                    <p className="text-sm text-foreground font-medium">{displayRisk.forecast_horizon}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                    <p className="text-sm text-foreground font-medium">{displayRisk.confidence}%</p>
                  </div>
                </div>

                {/* Signals */}
                <h4 className="text-sm font-semibold text-foreground mb-2">Risk Signals</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {Object.entries(displayRisk.signals).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${val >= 50 ? 'bg-[hsl(var(--status-high))]' : val >= 25 ? 'bg-[hsl(var(--status-medium))]' : 'bg-[hsl(var(--status-low))]'}`} style={{ width: `${val}%` }} />
                        </div>
                        <span className="text-xs text-foreground font-medium">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Affected Occupations */}
                <h4 className="text-sm font-semibold text-foreground mb-2">Affected Occupations</h4>
                <div className="space-y-1.5 mb-4">
                  {displayRisk.affected_occupations.map((occ, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border">
                      <span className="text-xs text-foreground">{occ.name}</span>
                      <span className={`text-[10px] ${occ.automation_risk > 40 ? 'text-[hsl(var(--status-high))]' : 'text-[hsl(var(--status-medium))]'}`}>
                        Auto-risk: {occ.automation_risk}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Recommended Reskilling */}
                <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Reskilling Areas</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayRisk.recommended_reskilling.map((skill, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-[hsl(var(--status-info))]/15 text-[hsl(var(--status-info))] border border-[hsl(var(--status-info))]/20">
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="p-3 rounded-lg bg-[hsl(var(--status-medium))]/10 border border-[hsl(var(--status-medium))]/20">
                  <p className="text-xs text-[hsl(var(--status-medium))]">
                    ⚠ {displayRisk.disclaimer}
                  </p>
                </div>
              </SectionCard>

              <EvidencePanel
                confidence={displayRisk.confidence}
                evidence={displayRisk.evidence}
                method={displayRisk.method}
                timestamp="DEMO DATASET — Simulated forecast"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}