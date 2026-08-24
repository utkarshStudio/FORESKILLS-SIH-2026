import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GitCompare, Play, Trophy, CheckCircle, TrendingUp } from 'lucide-react';
import { DISTRICTS, INDUSTRIES, INVESTMENTS } from '@/data/data';
import { compareScenarios } from '@/engines/engines';
import { SectionCard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '@/components/Charts';

export default function ScenarioComparison() {
  const location = useLocation();
  const passedInputs = location.state?.inputs;

  const [inputs, setInputs] = useState(/** @type {import('@/engines/engines').SimulationInput} */ (passedInputs || {
    district_id: 'nashik',
    industry_id: 'ev',
    investment_id: 'ev_nashik',
    budget_cr: 10,
    training_target: 10000,
    time_horizon_months: 24,
    priority: 'skill_gap_reduction',
  }));

  const [result, setResult] = useState(/** @type {ReturnType<typeof compareScenarios> | null} */ (null));
  const [running, setRunning] = useState(false);
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const handleCompare = () => {
    setRunning(true);
    setTimeout(() => {
      const cmp = compareScenarios(inputs);
      setResult(cmp);
      setRunning(false);
    }, 700);
  };

  useEffect(() => { handleCompare(); }, []);

  /** @param {string} field @param {*} value */
  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const availableInvestments = INVESTMENTS.filter(i => i.district_id === inputs.district_id && i.industry_id === inputs.industry_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Scenario Comparison
          </h1>
          <p className="text-sm text-muted-foreground">Compare policy strategies side-by-side and identify the recommended approach</p>
        </div>
        <DataSourceBadge />
      </div>

      <SectionCard title="Comparison Inputs" icon={GitCompare}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">District</label>
            <select value={inputs.district_id} onChange={e => handleInputChange('district_id', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50">
              {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Industry</label>
            <select value={inputs.industry_id} onChange={e => handleInputChange('industry_id', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50">
              {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Investment</label>
            <select value={(/** @type {string} */ (inputs.investment_id))} onChange={e => handleInputChange('investment_id', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50">
              {(availableInvestments.length > 0 ? availableInvestments : INVESTMENTS).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Budget (₹Cr)</label>
            <input type="number" value={inputs.budget_cr} onChange={e => handleInputChange('budget_cr', parseFloat(e.target.value) || 0)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Training Target</label>
            <input type="number" value={inputs.training_target} onChange={e => handleInputChange('training_target', parseInt(e.target.value) || 0)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Priority</label>
            <select value={inputs.priority} onChange={e => handleInputChange('priority', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50">
              <option value="skill_gap_reduction">Skill-Gap</option>
              <option value="employment_impact">Employment</option>
              <option value="local_retention">Retention</option>
              <option value="speed">Speed</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={running}
          className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {running ? (
            <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Comparing...</>
          ) : (
            <><Play className="w-4 h-4" /> Compare Scenarios</>
          )}
        </button>
      </SectionCard>

      {result && !running && (
        <>
          <div className={`p-4 rounded-xl border-2 ${
            result.recommended === 'A'
              ? 'bg-blue-500/10 border-blue-500/40'
              : 'bg-violet-500/10 border-violet-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                result.recommended === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'
              }`}>
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  Recommended: {result.recommended_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{result.reason}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-lg font-medium ${
                result.recommended === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'
              }`}>
                {result.recommended === 'A' ? result.a_wins : result.b_wins}/{result.comparison.length} metrics
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`rounded-xl border-2 p-4 ${
              result.recommended === 'A' ? 'bg-blue-500/5 border-blue-500/40' : 'bg-card border-border'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Scenario A: {result.scenario_a.name}</h3>
                  <p className="text-xs text-muted-foreground">{result.scenario_a.strategy}</p>
                </div>
                {result.recommended === 'A' && <Trophy className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Skill-Gap Reduction</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_a.optimization.skill_gap_reduction_pct}%</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Employment Impact</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_a.optimization.employment_impact.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Training Seats</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_a.optimization.total_seats.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Budget Allocated</p>
                  <p className="text-lg font-bold text-foreground">₹{result.scenario_a.optimization.total_allocated_cr}Cr</p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border-2 p-4 ${
              result.recommended === 'B' ? 'bg-violet-500/5 border-violet-500/40' : 'bg-card border-border'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Scenario B: {result.scenario_b.name}</h3>
                  <p className="text-xs text-muted-foreground">{result.scenario_b.strategy}</p>
                </div>
                {result.recommended === 'B' && <Trophy className="w-5 h-5 text-violet-400" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Skill-Gap Reduction</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_b.optimization.skill_gap_reduction_pct}%</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Employment Impact</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_b.optimization.employment_impact.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Training Seats</p>
                  <p className="text-lg font-bold text-foreground">{result.scenario_b.optimization.total_seats.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Budget Allocated</p>
                  <p className="text-lg font-bold text-foreground">₹{result.scenario_b.optimization.total_allocated_cr}Cr</p>
                </div>
              </div>
            </div>
          </div>

          <SectionCard title="Metric Comparison" subtitle="Side-by-side comparison of key outcomes" icon={TrendingUp} demo>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={result.comparison.filter(c => typeof c.scenario_a === 'number' && (/** @type {unknown} */ (c.scenario_b)) === 'number')} layout="vertical">
                <XAxis type="number" tick={{ fill: tickFill, fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fill: tickFill, fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="scenario_a" fill={cc.demand} radius={[0, 3, 3, 0]} name="Scenario A (Upgrade)" />
                <Bar dataKey="scenario_b" fill={cc.series[4]} radius={[0, 3, 3, 0]} name="Scenario B (Build New)" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Detailed Comparison" icon={CheckCircle} demo>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Metric</th>
                    <th className="text-right py-2 px-3 font-medium">Scenario A</th>
                    <th className="text-right py-2 px-3 font-medium">Scenario B</th>
                    <th className="text-center py-2 px-3 font-medium">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((c, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 px-3 text-foreground text-xs">{c.label}</td>
                      <td className={`py-2 px-3 text-right text-xs ${c.winner === 'A' ? 'text-blue-400 font-bold' : 'text-muted-foreground'}`}>
                        {c.scenario_a}{c.unit && ` ${c.unit}`}
                      </td>
                      <td className={`py-2 px-3 text-right text-xs ${c.winner === 'B' ? 'text-violet-400 font-bold' : 'text-muted-foreground'}`}>
                        {c.scenario_b}{c.unit && ` ${c.unit}`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {c.winner === 'A' && <span className="text-blue-400 text-xs font-bold">A</span>}
                        {c.winner === 'B' && <span className="text-violet-400 text-xs font-bold">B</span>}
                        {c.winner === 'tie' && <span className="text-muted-foreground text-xs">Tie</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <EvidencePanel
            confidence={80}
            evidence={[
              `Both scenarios use identical inputs: ₹${inputs.budget_cr}Cr budget, ${(/** @type {number} */ (inputs.training_target)).toLocaleString()} training target`,
              `Scenario A: upgrade existing institutes (lower cost per seat)`,
              `Scenario B: build new capacity (higher long-term capacity)`,
              `Recommendation based on ${result.comparison.length} calculated metrics`,
            ]}
            method={result.method}
            timestamp={result.timestamp}
          />
        </>
      )}
    </div>
  );
}