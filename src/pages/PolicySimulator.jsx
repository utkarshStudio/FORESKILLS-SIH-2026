import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator, Play, ArrowRight, Wrench, GraduationCap, Wallet, Factory, CheckCircle } from 'lucide-react';
import { DISTRICTS, INDUSTRIES, INVESTMENTS } from '@/data/data';
import { runSimulation } from '@/engines/engines';
import { SectionCard, KPICard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from '@/components/Charts';

export default function PolicySimulator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [inputs, setInputs] = useState({
    district_id: 'nashik',
    industry_id: 'ev',
    investment_id: searchParams.get('investment') || 'ev_nashik',
    budget_cr: 10,
    training_target: 10000,
    time_horizon_months: 24,
    priority: 'skill_gap_reduction',
    scenario_type: 'mixed',
  });

  const [result, setResult] = useState(/** @type {ReturnType<typeof runSimulation> | null} */ (null));
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const availableInvestments = INVESTMENTS.filter(i => i.district_id === inputs.district_id && i.industry_id === inputs.industry_id);

  // Auto-run on first load with default values (for demo)
  useEffect(() => {
    handleRun();
  }, []);

  // Update investment when district/industry changes
  useEffect(() => {
    if (availableInvestments.length > 0 && !availableInvestments.find(i => i.id === inputs.investment_id)) {
      setInputs(prev => ({ ...prev, investment_id: availableInvestments[0].id }));
    }
  }, [inputs.district_id, inputs.industry_id]);

  const handleRun = () => {
    setRunning(true);
    setHasRun(true);
    // Simulate brief computation time for UX
    setTimeout(() => {
      const simResult = runSimulation(inputs);
      setResult(simResult);
      setRunning(false);
    }, 600);
  };

  /** @param {string} field @param {*} value */
  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Policy Simulator
          </h1>
          <p className="text-sm text-muted-foreground">Simulate workforce policy and optimize budget allocation</p>
        </div>
        <DataSourceBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <SectionCard title="Simulation Inputs" icon={Calculator}>
            <div className="space-y-4">
              {/* District */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
                <select
                  value={inputs.district_id}
                  onChange={e => handleInputChange('district_id', e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Industry</label>
                <select
                  value={inputs.industry_id}
                  onChange={e => handleInputChange('industry_id', e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              {/* Investment Scenario */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Investment Scenario</label>
                {availableInvestments.length > 0 ? (
                  <select
                    value={inputs.investment_id}
                    onChange={e => handleInputChange('investment_id', e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    {availableInvestments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                ) : (
                  <select
                    value={inputs.investment_id}
                    onChange={e => handleInputChange('investment_id', e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    {INVESTMENTS.map(i => <option key={i.id} value={i.id}>{i.name} ({DISTRICTS.find(d=>d.id===i.district_id)?.name})</option>)}
                  </select>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Government Budget (₹ Crore)</label>
                <input
                  type="number"
                  value={inputs.budget_cr}
                  onChange={e => handleInputChange('budget_cr', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <div className="flex gap-1 mt-1.5">
                  {[6, 10, 15, 20].map(b => (
                    <button
                      key={b}
                      onClick={() => handleInputChange('budget_cr', b)}
                      className={`text-[10px] px-2 py-1 rounded font-medium ${
                        inputs.budget_cr === b ? 'bg-primary/15 text-primary' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ₹{b}Cr
                    </button>
                  ))}
                </div>
              </div>

              {/* Training Target */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Training Target (people)</label>
                <input
                  type="number"
                  value={inputs.training_target}
                  onChange={e => handleInputChange('training_target', parseInt(e.target.value) || 0)}
                  min="0"
                  step="500"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>

              {/* Time Horizon */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time Horizon (months)</label>
                <input
                  type="range"
                  value={inputs.time_horizon_months}
                  onChange={e => handleInputChange('time_horizon_months', parseInt(e.target.value))}
                  min="6"
                  max="60"
                  step="6"
                  className="w-full accent-primary"
                />
                <span className="text-xs text-muted-foreground">{inputs.time_horizon_months} months</span>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Optimization Priority</label>
                <select
                  value={inputs.priority}
                  onChange={e => handleInputChange('priority', e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="skill_gap_reduction">Skill-Gap Reduction</option>
                  <option value="employment_impact">Employment Impact</option>
                  <option value="local_retention">Local Retention</option>
                  <option value="speed">Speed of Delivery</option>
                </select>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={running || inputs.budget_cr <= 0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {running ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Running Simulation...</>
                ) : (
                  <><Play className="w-4 h-4" /> Run Simulation</>
                )}
              </button>

              {inputs.budget_cr <= 0 && (
                <p className="text-[10px] text-red-400 text-center">Budget must be greater than 0</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!result && !running && !hasRun && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Calculator className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Configure inputs and click "Run Simulation" to see results</p>
            </div>
          )}

          {running && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Running deterministic simulation...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Calculating skill gaps, training capacity, and budget optimization</p>
            </div>
          )}

          {result && !running && (
            <>
              {/* Impact KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard icon="gaps" color="red" label="Skill-Gap Reduction" value={`${result.skill_gap_reduction_pct}%`} />
                <KPICard icon="users" color="blue" label="Workforce Coverage" value={`${result.workforce_coverage_pct}%`} />
                <KPICard icon="retention" color="emerald" label="Employment Impact" value={result.employment_impact.toLocaleString()} />
                <KPICard icon="retention" color="cyan" label="Local Retention" value={`${result.local_retention_pct}%`} />
              </div>

              {/* Investment Summary */}
              {result.investment && (
                <SectionCard title="Investment Scenario" icon={Factory} demo>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><p className="text-[10px] text-muted-foreground uppercase">Investment</p><p className="text-sm text-foreground font-medium">₹{result.investment.investment_size_cr}Cr</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Expected Jobs</p><p className="text-sm text-foreground font-medium">{result.investment.expected_jobs.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Job Roles</p><p className="text-sm text-foreground font-medium">{result.affected_occupations.length}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Required Skills</p><p className="text-sm text-foreground font-medium">{result.required_skills.length}</p></div>
                  </div>
                </SectionCard>
              )}

              {/* Skill Gap Analysis */}
              <SectionCard title="Skill Gap Analysis" subtitle="Demand vs Supply vs Gap" icon={Wrench} demo>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.required_skills.map(s => ({ name: s.skill_name, demand: s.demand, supply: s.supply, gap: s.gap }))}>
                    <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 9 }} angle={-25} textAnchor="end" height={60} interval={0} />
                    <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="demand" fill={cc.demand} radius={[3, 3, 0, 0]} name="Demand" />
                    <Bar dataKey="supply" fill={cc.supply} radius={[3, 3, 0, 0]} name="Supply" />
                    <Bar dataKey="gap" fill={cc.gap} radius={[3, 3, 0, 0]} name="Gap" />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Budget Optimization */}
              <SectionCard title="Budget Optimization" subtitle={`₹${result.optimization.total_allocated_cr}Cr allocated of ₹${inputs.budget_cr}Cr`} icon={Wallet} demo
                action={
                  <button
                    onClick={() => navigate('/scenario-comparison', { state: { inputs } })}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Compare Scenarios <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="text-left py-2 px-3 font-medium">Allocation</th>
                        <th className="text-right py-2 px-3 font-medium">Units</th>
                        <th className="text-right py-2 px-3 font-medium">Amount (₹Cr)</th>
                        <th className="text-right py-2 px-3 font-medium">Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.allocation.map((alloc, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground text-xs">{alloc.label}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground text-xs">{alloc.units}</td>
                          <td className="py-2 px-3 text-right text-foreground text-xs font-medium">₹{alloc.amount_cr}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 text-xs">{alloc.seats > 0 ? alloc.seats.toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border">
                        <td className="py-2 px-3 text-foreground text-xs font-bold">Total Allocated</td>
                        <td className="py-2 px-3 text-right text-muted-foreground text-xs"></td>
                        <td className="py-2 px-3 text-right text-primary text-xs font-bold">₹{result.optimization.total_allocated_cr}Cr</td>
                        <td className="py-2 px-3 text-right text-emerald-400 text-xs font-bold">{result.optimization.total_seats.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Budget Utilization:</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${result.budget_utilization_pct}%` }} />
                  </div>
                  <span className="text-foreground font-medium">{result.budget_utilization_pct}%</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Feasible: {result.optimization.is_feasible ? 'Yes' : 'No'} · Remaining: ₹{result.optimization.remaining_budget_cr}Cr</span>
                </div>
              </SectionCard>

              {/* Training Requirements */}
              <SectionCard title="Training Requirements" icon={GraduationCap} demo>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Training Seats</p>
                    <p className="text-lg font-bold text-foreground">{result.workforce.training_seats_required.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Institute Upgrades</p>
                    <p className="text-lg font-bold text-foreground">{result.requirements.institute_upgrades}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Trainers</p>
                    <p className="text-lg font-bold text-foreground">{result.requirements.trainer_requirement}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Labs</p>
                    <p className="text-lg font-bold text-foreground">{result.requirements.labs_needed}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Evidence */}
              <EvidencePanel
                confidence={result.confidence}
                evidence={result.evidence}
                method={result.method}
                timestamp={result.timestamp}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}