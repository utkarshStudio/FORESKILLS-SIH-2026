import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, GraduationCap, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { DISTRICTS, INDUSTRIES, getDistrictInstitutes, getDistrictInvestments, getIndustryOccupations, generateTimeSeries } from '@/data/data';
import { calculateDistrictSkillGaps, getTotalSkillGap } from '@/engines/engines';
import { SectionCard, KPICard, DataSourceBadge, RiskBadge, EvidencePanel, PageHeader } from '@/components/Common';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '@/components/Charts';

export default function DistrictIntelligence() {
  const { districtId } = useParams();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState(districtId || 'nashik');
  const [view, setView] = useState('current'); // current | projected
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const district = DISTRICTS.find(d => d.id === selectedDistrict) || DISTRICTS[0];

  const data = useMemo(() => {
    const skillGaps = calculateDistrictSkillGaps(district.id);
    const institutes = getDistrictInstitutes(district.id);
    const investments = getDistrictInvestments(district.id);
    const totalGap = getTotalSkillGap(district.id);
    const districtIndustries = district.major_industry_ids.flatMap(id => {
    const industry = INDUSTRIES.find(i => i.id === id);
    return industry ? [industry] : [];
  });
    const occupations = district.major_industry_ids.flatMap(indId => getIndustryOccupations(indId));

    // Projected state (12 months ahead using growth rates)
    const projectedSkills = skillGaps.map(s => ({
      ...s,
      projected_demand: Math.round(s.demand * (1 + s.growth / 100)),
      projected_gap: Math.round(s.demand * (1 + s.growth / 100) - s.supply),
    }));

    // Time series for top skill
    const topSkill = skillGaps.sort((a, b) => b.demand - a.demand)[0];
    const timeseries = topSkill ? generateTimeSeries(topSkill.skill_id, district.id, 12) : [];

    return { skillGaps, institutes, investments, totalGap, districtIndustries, occupations, projectedSkills, topSkill, timeseries };
  }, [district]);

  return (
    <div className="space-y-5">
      <PageHeader title={`District Intelligence — ${district.name}`} subtitle={`${district.region} · Workforce & Training Analysis`}>
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Back to Decision Center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <DataSourceBadge />
      </PageHeader>

      {/* District Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DISTRICTS.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDistrict(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDistrict === d.id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* District Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon="users" color="cyan" label="Population" value={`${(district.population / 1000000).toFixed(1)}M`} />
        <KPICard icon="users" color="blue" label="Workforce" value={`${(district.workforce / 1000000).toFixed(1)}M`} />
        <KPICard icon="gaps" color="red" label="Total Skill Gap" value={data.totalGap.total_gap} sublabel="demand index" />
        <KPICard icon="training" color="violet" label="Training Institutes" value={data.institutes.length} sublabel={`${data.institutes.reduce((s, i) => s + i.capacity, 0)} seats`} />
        <KPICard icon="investments" color="emerald" label="Investments" value={data.investments.length} sublabel={`₹${data.investments.reduce((s, i) => s + i.investment_size_cr, 0)}Cr`} />
        <KPICard icon="risk" color="amber" label="Avg Confidence" value={`${data.totalGap.avg_confidence}%`} sublabel="data quality" />
      </div>

      {/* Current vs Projected Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('current')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'current' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground'
          }`}
        >
          Current State
        </button>
        <button
          onClick={() => setView('projected')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'projected' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground'
          }`}
        >
          Projected State (12 months)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Skill Demand/Supply */}
        <SectionCard title="Skill Demand vs Supply" subtitle={view === 'current' ? 'Current workforce data' : '12-month projection'} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={view === 'current' ? data.skillGaps.map(s => ({ name: s.skill_name, demand: s.demand, supply: s.supply, gap: s.gap })) : data.projectedSkills.map(s => ({ name: s.skill_name, demand: s.projected_demand, supply: s.supply, gap: s.projected_gap }))}>
              <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 9 }} angle={-25} textAnchor="end" height={60} interval={0} />
              <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="demand" fill={cc.demand} radius={[3, 3, 0, 0]} />
              <Bar dataKey="supply" fill={cc.supply} radius={[3, 3, 0, 0]} />
              <Bar dataKey="gap" fill={cc.gap} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Skill Trend */}
        {data.topSkill && (
          <SectionCard title="Demand Trend" subtitle={`${data.topSkill.skill_name} — 12 month history`} icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.timeseries}>
                <XAxis dataKey="month" tick={{ fill: tickFill, fontSize: 10 }} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="demand" stroke={cc.demand} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="supply" stroke={cc.supply} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gap" stroke={cc.gap} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
      </div>

      {/* Industries & Occupations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Major Industries" subtitle="Key sectors in this district" icon={Building2} demo>
          <div className="space-y-2">
            {data.districtIndustries.map(ind => (
              <div key={ind.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ind.color }} />
                  <span className="text-sm text-foreground font-medium">{ind.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400">+{ind.growth_rate}%</span>
                  <RiskBadge level={ind.automation_risk > 40 ? 'HIGH' : ind.automation_risk > 20 ? 'MEDIUM' : 'LOW'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Occupations" subtitle="Key job roles by industry" icon={Users} demo>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {data.occupations.slice(0, 10).map(occ => (
              <div key={occ.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30">
                <span className="text-xs text-foreground">{occ.name}</span>
                <span className="text-[10px] text-muted-foreground">Auto-risk: {occ.automation_risk}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Training Institutes */}
      <SectionCard title="Training Institutes" subtitle="Current capacity and utilization" icon={GraduationCap} demo>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Institute</th>
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-right py-2 px-3 font-medium">Capacity</th>
                <th className="text-right py-2 px-3 font-medium">Utilization</th>
                <th className="text-right py-2 px-3 font-medium">Available</th>
                <th className="text-left py-2 px-3 font-medium">Programs</th>
              </tr>
            </thead>
            <tbody>
              {data.institutes.map(inst => (
                <tr key={inst.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2 px-3 text-foreground text-xs">{inst.name}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{inst.type}</td>
                  <td className="py-2 px-3 text-right text-foreground text-xs">{inst.capacity}</td>
                  <td className="py-2 px-3 text-right text-xs">
                    <span className={inst.utilization > 0.85 ? 'text-red-400' : inst.utilization > 0.7 ? 'text-amber-400' : 'text-emerald-400'}>
                      {Math.round(inst.utilization * 100)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-foreground text-xs">{Math.round(inst.capacity * (1 - inst.utilization))}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{inst.program_skills.length} programs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Investment Signals */}
      {data.investments.length > 0 && (
        <SectionCard title="Investment Signals" subtitle="Active investments in this district" icon={TrendingUp} demo>
          <div className="space-y-2">
            {data.investments.map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border hover:border-primary/30 cursor-pointer"
                onClick={() => navigate('/investments')}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">₹{inv.investment_size_cr}Cr · {inv.expected_jobs} expected jobs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${inv.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {inv.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Evidence */}
      <EvidencePanel
        confidence={data.totalGap.avg_confidence}
        evidence={[
          `${data.skillGaps.length} skills tracked in ${district.name}`,
          `${data.institutes.length} training institutes analyzed`,
          `${data.investments.length} investment signals`,
          `${data.occupations.length} occupation categories mapped`,
        ]}
        method="District intelligence aggregates skill demand, supply, training capacity, and investment signals from seeded demo data"
        timestamp={`DEMO DATASET — ${district.name}`}
      />
    </div>
  );
}