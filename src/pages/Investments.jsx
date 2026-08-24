import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowDown, Building2, Users, Wrench, GraduationCap, Wallet, Factory } from 'lucide-react';
import { INVESTMENTS, DISTRICTS, INDUSTRIES } from '@/data/data';
import { runSimulation } from '@/engines/engines';
import { SectionCard, KPICard, DataSourceBadge, RiskBadge, EvidencePanel } from '@/components/Common';

export default function Investments() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('ev_nashik');

  const investment = INVESTMENTS.find(i => i.id === selectedId) || INVESTMENTS[0];
  const district = DISTRICTS.find(d => d.id === investment.district_id);
  const industry = INDUSTRIES.find(i => i.id === investment.industry_id);

  const analysis = useMemo(() => {
    return runSimulation({
      district_id: investment.district_id,
      industry_id: investment.industry_id,
      investment_id: investment.id,
      budget_cr: 10,
      training_target: 10000,
      time_horizon_months: 24,
      priority: 'skill_gap_reduction',
      scenario_type: 'mixed',
    });
  }, [investment]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Investment → Skill Converter</h1>
          <p className="text-sm text-muted-foreground">Analyze how investments translate to workforce and training requirements</p>
        </div>
        <DataSourceBadge />
      </div>

      {/* Investment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INVESTMENTS.map(inv => {
          const dist = DISTRICTS.find(d => d.id === inv.district_id);
          return (
            <div
              key={inv.id}
              onClick={() => setSelectedId(inv.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedId === inv.id
                  ? 'bg-primary/5 border-primary/40'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Factory className="w-4 h-4 text-primary" />
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                  {inv.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{inv.name}</p>
              <p className="text-xs text-muted-foreground">{dist?.name} · {industry?.name}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-foreground font-medium">₹{inv.investment_size_cr}Cr</span>
                <span className="text-muted-foreground">{inv.expected_jobs} jobs</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Analysis */}
      <SectionCard
        title={`Analysis: ${investment.name}`}
        subtitle={`${district?.name} · ${industry?.name} · ${investment.description}`}
        icon={TrendingUp}
        demo
        action={
          <button
            onClick={() => navigate(`/policy-simulator?investment=${investment.id}`)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
          >
            Run Policy Simulation <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        {/* Conversion Pipeline */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
          {[
            { label: 'Investment', value: `₹${investment.investment_size_cr}Cr`, icon: Wallet, color: 'text-emerald-400' },
            { label: 'Industry', value: industry?.name, icon: Building2, color: 'text-blue-400' },
            { label: 'Job Roles', value: `${analysis.affected_occupations.length}`, icon: Users, color: 'text-cyan-400' },
            { label: 'Skills', value: `${analysis.required_skills.length}`, icon: Wrench, color: 'text-violet-400' },
            { label: 'Workers', value: `${analysis.workforce.workforce_requirement.toLocaleString()}`, icon: Users, color: 'text-amber-400' },
            { label: 'Training Seats', value: `${analysis.workforce.training_seats_required.toLocaleString()}`, icon: GraduationCap, color: 'text-red-400' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex-shrink-0 text-center min-w-[100px]">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center mx-auto mb-1.5">
                  <step.icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                <p className="text-xs text-foreground font-medium">{step.value}</p>
              </div>
              {i < arr.length - 1 && <ArrowDown className="w-4 h-4 text-muted-foreground/40 hidden md:block" style={{ transform: 'rotate(-90deg)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KPICard icon="gaps" color="red" label="Total Skill Gap" value={analysis.workforce.total_gap} sublabel="demand index" />
          <KPICard icon="training" color="violet" label="Capacity Gap" value={analysis.training_capacity.capacity_gap.toLocaleString()} sublabel="seats needed" />
          <KPICard icon="training" color="amber" label="Institutes to Upgrade" value={analysis.requirements.institute_upgrades} sublabel="facilities" />
          <KPICard icon="budget" color="emerald" label="Est. Full Cost" value={`₹${analysis.estimated_cost_cr}Cr`} sublabel="unconstrained" />
        </div>

        {/* Affected Job Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Affected Job Roles</h4>
            <div className="space-y-1.5">
              {analysis.affected_occupations.map(occ => (
                <div key={occ.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border">
                  <div>
                    <p className="text-xs text-foreground font-medium">{occ.name}</p>
                    <p className="text-[10px] text-muted-foreground">{occ.required_skills.join(', ')}</p>
                  </div>
                  <RiskBadge level={occ.automation_risk > 40 ? 'HIGH' : occ.automation_risk > 20 ? 'MEDIUM' : 'LOW'} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Required Skills — Gap Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-1.5 px-2 font-medium">Skill</th>
                    <th className="text-right py-1.5 px-2 font-medium">Demand</th>
                    <th className="text-right py-1.5 px-2 font-medium">Supply</th>
                    <th className="text-right py-1.5 px-2 font-medium">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.required_skills.map(s => (
                    <tr key={s.skill_id} className="border-b border-border/50">
                      <td className="py-1.5 px-2 text-foreground text-xs">{s.skill_name}</td>
                      <td className="py-1.5 px-2 text-right text-blue-400 text-xs">{s.demand}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-400 text-xs">{s.supply}</td>
                      <td className="py-1.5 px-2 text-right text-red-400 text-xs font-medium">{s.gap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Training Capacity */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Existing Training Capacity</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-1.5 px-2 font-medium">Institute</th>
                  <th className="text-left py-1.5 px-2 font-medium">Type</th>
                  <th className="text-right py-1.5 px-2 font-medium">Capacity</th>
                  <th className="text-right py-1.5 px-2 font-medium">Utilization</th>
                  <th className="text-right py-1.5 px-2 font-medium">Available</th>
                </tr>
              </thead>
              <tbody>
                {analysis.training_capacity.institutes.map((inst, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2 text-foreground text-xs">{inst.name}</td>
                    <td className="py-1.5 px-2 text-muted-foreground text-xs">{inst.type}</td>
                    <td className="py-1.5 px-2 text-right text-foreground text-xs">{inst.capacity}</td>
                    <td className="py-1.5 px-2 text-right text-xs">
                      <span className={inst.utilization > 85 ? 'text-red-400' : 'text-amber-400'}>{inst.utilization}%</span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-emerald-400 text-xs">{inst.available_seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requirements Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Institute Upgrades</p>
            <p className="text-lg font-bold text-foreground">{analysis.requirements.institute_upgrades}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Trainers Needed</p>
            <p className="text-lg font-bold text-foreground">{analysis.requirements.trainer_requirement}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Labs Needed</p>
            <p className="text-lg font-bold text-foreground">{analysis.requirements.labs_needed}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Training Seats</p>
            <p className="text-lg font-bold text-foreground">{analysis.workforce.training_seats_required.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4">
          <EvidencePanel
            confidence={analysis.confidence}
            evidence={analysis.evidence}
            method={analysis.method}
            timestamp={analysis.timestamp}
          />
        </div>
      </SectionCard>
    </div>
  );
}