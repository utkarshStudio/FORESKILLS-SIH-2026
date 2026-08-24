import React, { useState, useEffect } from 'react';
import { Wallet, Play, CheckCircle, Target } from 'lucide-react';
import { DISTRICTS } from '@/data/data';
import { runOptimization, calculateDistrictSkillGaps } from '@/engines/engines';
import { SectionCard, KPICard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '@/components/Charts';

export default function BudgetOptimizer() {
  const [budget, setBudget] = useState(10);
  const [districtId, setDistrictId] = useState('nashik');
  const [priority, setPriority] = useState('skill_gap_reduction');
  const [result, setResult] = useState(/** @type {ReturnType<typeof runOptimization> | null} */ (null));
  const [running, setRunning] = useState(false);
  const { tooltipStyle, colors: cc } = useChartTheme();

  const district = DISTRICTS.find(d => d.id === districtId);
  const skillGaps = calculateDistrictSkillGaps(districtId);
  const trainingSeatsRequired = Math.round(skillGaps.reduce((s, g) => s + g.gap, 0) * 100);

  const handleOptimize = () => {
    setRunning(true);
    setTimeout(() => {
      const opt = runOptimization({
        budget_cr: budget,
        district_id: districtId,
        district_name: district?.name,
        priority,
        training_seats_required: trainingSeatsRequired,
        existing_capacity: 0,
        scenario_type: 'mixed',
        skill_gaps: skillGaps,
      });
      setResult(opt);
      setRunning(false);
    }, 500);
  };

  useEffect(() => { handleOptimize(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Budget Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">Deterministic budget allocation optimization</p>
        </div>
        <DataSourceBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Panel */}
        <SectionCard title="Optimization Inputs" icon={Wallet}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget (₹ Crore)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <div className="flex gap-1 mt-1.5">
                {[3, 6, 10, 15, 20].map(b => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`text-[10px] px-2 py-1 rounded font-medium ${
                      budget === b ? 'bg-primary/15 text-primary' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ₹{b}Cr
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
              <select
                value={districtId}
                onChange={e => setDistrictId(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              >
                {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority Objective</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="skill_gap_reduction">Skill-Gap Reduction</option>
                <option value="employment_impact">Employment Impact</option>
                <option value="local_retention">Local Retention</option>
                <option value="speed">Speed of Delivery</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Training Need</p>
              <p className="text-sm text-foreground font-medium">{trainingSeatsRequired.toLocaleString()} seats</p>
              <p className="text-[10px] text-muted-foreground mt-1">Based on {skillGaps.length} skill gaps in {district?.name}</p>
            </div>

            <button
              onClick={handleOptimize}
              disabled={running || budget <= 0}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {running ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Optimizing...</>
              ) : (
                <><Play className="w-4 h-4" /> Optimize Budget</>
              )}
            </button>
          </div>
        </SectionCard>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {result && !running && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard icon="gaps" color="red" label="Skill-Gap Reduction" value={`${result.skill_gap_reduction_pct}%`} />
                <KPICard icon="users" color="blue" label="Training Seats" value={result.total_seats.toLocaleString()} />
                <KPICard icon="retention" color="emerald" label="Employment Impact" value={result.employment_impact.toLocaleString()} />
                <KPICard icon="retention" color="cyan" label="Local Retention" value={`${result.local_retention_pct}%`} />
              </div>

              {/* Allocation Pie + Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionCard title="Allocation Breakdown" icon={Target} demo>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={result.allocation.map(a => ({ name: a.label, value: a.amount_cr }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {result.allocation.map((_, i) => <Cell key={i} fill={cc.series[i % cc.series.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => `₹${v}Cr`}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </SectionCard>

                <SectionCard title="Allocation Details" icon={Wallet} demo>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 px-2 font-medium">Category</th>
                          <th className="text-right py-2 px-2 font-medium">₹Cr</th>
                          <th className="text-right py-2 px-2 font-medium">Seats</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.allocation.map((a, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-2 text-foreground text-xs">{a.label}</td>
                            <td className="py-2 px-2 text-right text-foreground text-xs font-medium">₹{a.amount_cr}</td>
                            <td className="py-2 px-2 text-right text-emerald-400 text-xs">{a.seats > 0 ? a.seats.toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

              {/* Budget Summary */}
              <SectionCard title="Budget Summary" icon={CheckCircle} demo>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Budget</p>
                    <p className="text-lg font-bold text-foreground">₹{result.budget_cr}Cr</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Allocated</p>
                    <p className="text-lg font-bold text-primary">₹{result.total_allocated_cr}Cr</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
                    <p className="text-lg font-bold text-emerald-400">₹{result.remaining_budget_cr}Cr</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Feasible</p>
                    <p className="text-lg font-bold text-emerald-400">{result.is_feasible ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">
                    Budget constraint satisfied: {result.constraints_satisfied.budget ? '✓' : '✗'} ·
                    Institute capacity: {result.constraints_satisfied.institute_capacity ? '✓' : '✗'} ·
                    Trainer capacity: {result.constraints_satisfied.trainer_capacity ? '✓' : '✗'}
                  </span>
                </div>
              </SectionCard>

              <EvidencePanel
                confidence={82}
                evidence={[
                  `Budget: ₹${result.budget_cr}Cr — never exceeded`,
                  `Priority: ${priority.replace(/_/g, ' ')}`,
                  `${result.allocation.length} allocation categories`,
                  `Greedy optimization by impact-per-₹Cr`,
                ]}
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