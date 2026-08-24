import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Users, Wallet, MapPin, ArrowRight, Lightbulb } from 'lucide-react';
import { DISTRICTS, INVESTMENTS } from '@/data/data';
import { calculateDistrictSkillGaps, getEmergingSkillGaps, getAllRisks } from '@/engines/engines';
import { KPI, Panel, PageHeader, RiskBadge, DataSourceBadge, EvidencePanel } from '@/components/Common';
import MaharashtraMap from '@/components/Maps';

/** @type {readonly ['risk', 'gap', 'investment']} */
const MAP_METRICS = ['risk', 'gap', 'investment'];

export default function DecisionCenter() {
  const navigate = useNavigate();
  const [mapMetric, setMapMetric] = useState(/** @type {'risk'|'gap'|'investment'} */('risk'));

  const data = useMemo(() => {
    const allGaps = getEmergingSkillGaps();
    const allRisks = getAllRisks();
    const highRisks = allRisks.filter(r => r.risk_level === 'HIGH');

    let totalCapacityGap = 0;
    for (const district of DISTRICTS) {
      const gaps = calculateDistrictSkillGaps(district.id);
      totalCapacityGap += gaps.reduce((s, g) => s + g.gap, 0) * 100;
    }

    // Priority signals — top 4 emerging skill gaps with district context
    const prioritySignals = allGaps.slice(0, 4).map(g => ({
      district: g.district_name,
      skill: g.skill_name,
      gap: g.gap,
      growth: g.growth,
    }));

    return {
      emergingGaps: allGaps.length,
      workforceRisk: highRisks.length,
      capacityGap: Math.round(totalCapacityGap),
      budget: 10,
      prioritySignals,
      allRisks: allRisks.slice(0, 5),
      investments: INVESTMENTS.slice(0, 5),
    };
  }, []);

  // Recent policy simulations — read from stored runs (localStorage cache)
  const recentSimulations = useMemo(() => {
    try {
      const raw = localStorage.getItem('foreskills-simulations');
      if (!raw) return [];
      const runs = JSON.parse(raw);
      return Array.isArray(runs) ? runs.slice(0, 5) : [];
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="FORESKILLS" subtitle="Workforce Intelligence & Policy Simulation">
        <DataSourceBadge />
      </PageHeader>

      {/* Section 1 — Key Workforce Signals */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Key Workforce Signals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI icon={TrendingUp} label="Emerging Skill Gaps" value={data.emergingGaps} sublabel="across Maharashtra" status="high" />
          <KPI icon={AlertTriangle} label="Workforce Risk" value={data.workforceRisk} sublabel="high-risk districts" status="medium" />
          <KPI icon={Users} label="Training Capacity Gap" value={`${(data.capacityGap / 1000).toFixed(0)}K`} unit="seats" sublabel="needed statewide" />
          <KPI icon={Wallet} label="Available Budget" value={`₹${data.budget}`} unit="Cr" sublabel="allocation pending" status="low" />
        </div>
      </div>

      {/* Section 2 — Maharashtra Workforce Map */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Maharashtra Workforce Map</h2>
        <Panel
          title="District Intelligence"
          subtitle="Click a district to view detailed analysis"
          icon={MapPin}
          action={
            <div className="flex items-center gap-1">
              {MAP_METRICS.map(m => (
                <button
                  key={m}
                  onClick={() => setMapMetric(m)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    mapMetric === m ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {m === 'risk' ? 'Risk' : m === 'gap' ? 'Skill Gap' : 'Investment'}
                </button>
              ))}
            </div>
          }
        >
          <MaharashtraMap
            metric={mapMetric}
            onDistrictClick={(id) => navigate(`/district/${id}`)}
            height={400}
          />
        </Panel>
      </div>

      {/* Section 3 — Priority Signals */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Priority Signals</h2>
        <Panel title="Most Important Alerts" subtitle="Top emerging skill gaps by district" icon={AlertTriangle}>
          <div className="divide-y divide-border">
            {data.prioritySignals.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-accent/5 transition-colors -mx-4 px-4"
                onClick={() => navigate(`/district/${s.district.toLowerCase().replace(/\s+/g, '_')}`)}
              >
                <span className="w-6 h-6 rounded-md bg-[hsl(var(--status-high))]/12 flex items-center justify-center flex-shrink-0">
                  <span className="text-[hsl(var(--status-high))] text-xs font-bold">{i + 1}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.district} — {s.skill} shortage</p>
                  <p className="text-xs text-muted-foreground">Gap index {s.gap} · Growth {s.growth}%</p>
                </div>
                <RiskBadge level={s.gap > 45 ? 'HIGH' : 'MEDIUM'} size="sm" />
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Section 4 — Recent Policy Simulations */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Recent Policy Simulations</h2>
        <Panel
          title="Simulation History"
          subtitle="Previously run policy scenarios"
          icon={Lightbulb}
          action={
            <button
              onClick={() => navigate('/policy-simulator')}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              Run new <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {recentSimulations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No simulation has been run yet.</p>
              <button
                onClick={() => navigate('/policy-simulator')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
              >
                Launch Policy Simulator <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Scenario</th>
                    <th className="py-2 pr-4 font-medium">District</th>
                    <th className="py-2 pr-4 font-medium">Budget</th>
                    <th className="py-2 pr-4 font-medium">Expected Impact</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSimulations.map((sim, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/5">
                      <td className="py-2.5 pr-4 text-foreground">{sim.inputs?.investment_name || sim.inputs?.industry_name || '—'}</td>
                      <td className="py-2.5 pr-4 text-foreground">{sim.inputs?.district_name || '—'}</td>
                      <td className="py-2.5 pr-4 text-foreground">₹{sim.inputs?.budget_cr || 0}Cr</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{sim.skill_gap_reduction_pct || 0}% gap reduction</td>
                      <td className="py-2"><RiskBadge level="ACTIVE" size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <EvidencePanel
        confidence={78}
        evidence={[
          `Aggregated from ${DISTRICTS.length} district skill-gap analyses`,
          `${getAllRisks().length} industry risk assessments`,
          `${INVESTMENTS.filter(i => i.status === 'active' || i.status === 'announced').length} active investment signals`,
          '12 canonical skills tracked',
        ]}
        method="Dashboard aggregates district skill gaps, workforce risk scores, and investment signals from the reference dataset. All figures are computed by deterministic engines."
        timestamp="Computed from reference dataset — Q2 2026"
      />
    </div>
  );
}