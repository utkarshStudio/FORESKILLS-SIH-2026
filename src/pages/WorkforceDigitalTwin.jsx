import React, { useState, useMemo, useEffect } from 'react';
import { Users, Factory, GraduationCap, TrendingUp, Play, Cpu, Zap, Clock, DollarSign } from 'lucide-react';
import { DISTRICTS, INDUSTRIES, INVESTMENTS } from '@/data/data';
import { runSimulation } from '@/engines/engines';
import { SectionCard, KPICard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '@/components/Charts';

const WHAT_IF_SCENARIOS = [
  { id: 'new_factory', label: 'New Factory Opens', icon: Factory, adjustment: { investment_multiplier: 1.0, budget_adjust: 0 } },
  { id: 'automation', label: 'Automation Increases', icon: Cpu, adjustment: { automation_increase: 20 } },
  { id: 'delayed', label: 'Investment Delayed', icon: Clock, adjustment: { time_horizon_multiplier: 1.5 } },
  { id: 'budget_cut', label: 'Training Budget Reduced', icon: DollarSign, adjustment: { budget_multiplier: 0.6 } },
];

/**
 * @typedef {ReturnType<typeof runSimulation>['required_skills'][number]} TwinSkillRow
 * @typedef {ReturnType<typeof runSimulation> & {
 *   projected_skills: Array<TwinSkillRow & { projected_demand: number, projected_gap: number }>,
 *   scenario_label: string,
 * }} TwinResult
 */

export default function WorkforceDigitalTwin() {
  const [districtId, setDistrictId] = useState('nashik');
  const [industryId, setIndustryId] = useState('ev');
  const [scenarioId, setScenarioId] = useState('new_factory');
  const [timeHorizon, setTimeHorizon] = useState(24);
  const [result, setResult] = useState(/** @type {TwinResult | null} */ (null));
  const [running, setRunning] = useState(false);
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const district = DISTRICTS.find(d => d.id === districtId);
  const availableInvestments = INVESTMENTS.filter(i => i.district_id === districtId && i.industry_id === industryId);
  const investmentId = availableInvestments[0]?.id;

  const scenario = /** @type {typeof WHAT_IF_SCENARIOS[number]} */ (WHAT_IF_SCENARIOS.find(s => s.id === scenarioId));

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      let budget = 10;
      let horizon = timeHorizon;
      if (scenario.adjustment.budget_multiplier) budget *= scenario.adjustment.budget_multiplier;
      if (scenario.adjustment.time_horizon_multiplier) horizon = Math.round(horizon * scenario.adjustment.time_horizon_multiplier);

      const sim = runSimulation({
        district_id: districtId,
        industry_id: industryId,
        investment_id: investmentId,
        budget_cr: budget,
        training_target: 10000,
        time_horizon_months: horizon,
        priority: 'skill_gap_reduction',
        scenario_type: 'mixed',
      });

      const projectedDemand = sim.required_skills.map(s => ({
        ...s,
        projected_demand: Math.round(s.demand * (1 + s.growth / 100)),
        projected_gap: Math.round(s.demand * (1 + s.growth / 100) - s.supply),
      }));

      setResult({ ...sim, projected_skills: projectedDemand, scenario_label: scenario.label });
      setRunning(false);
    }, 600);
  };

  useEffect(() => { handleRun(); }, []);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.required_skills.map(s => ({
      name: s.skill_name,
      current: s.gap,
      projected: result.projected_skills.find(p => p.skill_id === s.skill_id)?.projected_gap || s.gap,
    }));
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Workforce Digital Twin
          </h1>
          <p className="text-sm text-muted-foreground">Simulate workforce changes with What-If scenario controls</p>
        </div>
        <DataSourceBadge />
      </div>

      <SectionCard title="Digital Twin Controls" icon={Cpu}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
            <select value={districtId} onChange={e => setDistrictId(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
              {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Industry</label>
            <select value={industryId} onChange={e => setIndustryId(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
              {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time Horizon (months)</label>
            <input type="range" value={timeHorizon} onChange={e => setTimeHorizon(parseInt(e.target.value))} min="6" max="60" step="6" className="w-full accent-primary" />
            <span className="text-xs text-muted-foreground">{timeHorizon} months</span>
          </div>
          <div className="flex items-end">
            <button onClick={handleRun} disabled={running} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {running ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Simulating...</> : <><Play className="w-4 h-4" /> Run Simulation</>}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">What-If Scenario</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {WHAT_IF_SCENARIOS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    scenarioId === s.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {result && !running && (
        <>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Scenario: {result.scenario_label}</p>
              <p className="text-xs text-muted-foreground">District: {district?.name} · Industry: {INDUSTRIES.find(i => i.id === industryId)?.name} · Budget: ₹{result.optimization.budget_cr}Cr</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon="users" color="cyan" label="Workforce Need" value={result.workforce.workforce_requirement.toLocaleString()} />
            <KPICard icon="gaps" color="red" label="Current Gap" value={result.workforce.total_gap} />
            <KPICard icon="training" color="violet" label="Training Seats" value={result.workforce.training_seats_required.toLocaleString()} />
            <KPICard icon="budget" color="emerald" label="Budget Used" value={`₹${result.optimization.total_allocated_cr}Cr`} />
          </div>

          <SectionCard title="Current vs Projected Skill Gap" subtitle="What-If scenario impact on skill gaps" icon={TrendingUp} demo>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 9 }} angle={-25} textAnchor="end" height={60} interval={0} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="current" fill={cc.demand} radius={[3, 3, 0, 0]} name="Current Gap" />
                <Bar dataKey="projected" fill={cc.series[3]} radius={[3, 3, 0, 0]} name="Projected Gap" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Training Requirements" icon={GraduationCap} demo>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Institute Upgrades</span>
                  <span className="text-sm text-foreground font-medium">{result.requirements.institute_upgrades}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Trainers Required</span>
                  <span className="text-sm text-foreground font-medium">{result.requirements.trainer_requirement}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Labs Needed</span>
                  <span className="text-sm text-foreground font-medium">{result.requirements.labs_needed}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Training Seats</span>
                  <span className="text-sm text-foreground font-medium">{result.workforce.training_seats_required.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Estimated Full Cost</span>
                  <span className="text-sm text-foreground font-medium">₹{result.estimated_cost_cr}Cr</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Impact Projection" icon={TrendingUp} demo>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Skill-Gap Reduction</span>
                  <span className="text-sm text-emerald-400 font-medium">{result.skill_gap_reduction_pct}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Workforce Coverage</span>
                  <span className="text-sm text-blue-400 font-medium">{result.workforce_coverage_pct}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Employment Impact</span>
                  <span className="text-sm text-cyan-400 font-medium">{result.employment_impact.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Local Retention</span>
                  <span className="text-sm text-violet-400 font-medium">{result.local_retention_pct}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground">Budget Utilization</span>
                  <span className="text-sm text-amber-400 font-medium">{result.budget_utilization_pct}%</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <EvidencePanel
            confidence={result.confidence}
            evidence={result.evidence}
            method={`Digital twin simulation with What-If scenario: ${result.scenario_label}. ${result.method}`}
            timestamp={result.timestamp}
          />
        </>
      )}
    </div>
  );
}