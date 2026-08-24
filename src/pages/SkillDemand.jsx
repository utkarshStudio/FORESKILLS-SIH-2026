import React, { useState, useMemo } from 'react';
import { Radar, TrendingUp } from 'lucide-react';
import { DISTRICTS, getDistrictSkills } from '@/data/data';
import { SectionCard, DataSourceBadge, ConfidenceIndicator } from '@/components/Common';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from '@/components/Charts';

const CATEGORIES = [
  { id: 'all', label: 'All Skills' },
  { id: 'high_demand', label: 'High Demand' },
  { id: 'fast_growing', label: 'Fast Growing' },
  { id: 'emerging', label: 'Emerging' },
  { id: 'stable', label: 'Stable' },
];

export default function SkillDemand() {
  const [districtId, setDistrictId] = useState('all');
  const [category, setCategory] = useState('all');
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const skills = useMemo(() => {
    let allSkills = [];
    if (districtId === 'all') {
      for (const d of DISTRICTS) {
        const ds = getDistrictSkills(d.id);
        allSkills.push(...ds.map(s => ({ ...s, district_name: d.name })));
      }
    } else {
      allSkills = getDistrictSkills(districtId).map(s => ({ ...s, district_name: DISTRICTS.find(d => d.id === districtId)?.name }));
    }

    if (districtId === 'all') {
      /** @type {Record<string, typeof allSkills[number] & { count: number, districts: (string | undefined)[] }>} */
      const agg = {};
      for (const s of allSkills) {
        if (!agg[s.id]) agg[s.id] = { ...s, demand: 0, supply: 0, gap: 0, count: 0, districts: [] };
        agg[s.id].demand += s.demand;
        agg[s.id].supply += s.supply;
        agg[s.id].gap += s.gap;
        agg[s.id].count++;
        agg[s.id].districts.push(s.district_name);
      }
      allSkills = Object.values(agg).map(s => ({
        ...s,
        demand: Math.round(s.demand / s.count),
        supply: Math.round(s.supply / s.count),
        gap: Math.round(s.gap / s.count),
        district_name: `${s.count} districts`,
      }));
    }

    if (category !== 'all') {
      allSkills = allSkills.filter(s => s.category === category);
    }

    return allSkills.sort((a, b) => b.demand - a.demand);
  }, [districtId, category]);

  const chartData = skills.slice(0, 10).map(s => ({
    name: s.name,
    demand: s.demand,
    supply: s.supply,
    gap: s.gap,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            Skill Demand Radar
          </h1>
          <p className="text-sm text-muted-foreground">Canonical skill intelligence with demand, supply, and gap analysis</p>
        </div>
        <DataSourceBadge />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={districtId} onChange={e => setDistrictId(e.target.value)} className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50">
          <option value="all">All Districts</option>
          {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                category === c.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title="Top Skills — Demand vs Supply" icon={TrendingUp} demo>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 9 }} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="demand" fill={cc.demand} radius={[3, 3, 0, 0]} name="Demand" />
            <Bar dataKey="supply" fill={cc.supply} radius={[3, 3, 0, 0]} name="Supply" />
            <Bar dataKey="gap" fill={cc.gap} radius={[3, 3, 0, 0]} name="Gap" />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Skill Intelligence" subtitle={`${skills.length} skills tracked`} icon={Radar} demo>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Skill</th>
                <th className="text-left py-2 px-3 font-medium">Category</th>
                <th className="text-left py-2 px-3 font-medium hidden md:table-cell">District</th>
                <th className="text-right py-2 px-3 font-medium">Demand</th>
                <th className="text-right py-2 px-3 font-medium">Supply</th>
                <th className="text-right py-2 px-3 font-medium">Gap</th>
                <th className="text-right py-2 px-3 font-medium hidden md:table-cell">Growth</th>
                <th className="text-left py-2 px-3 font-medium hidden lg:table-cell">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="py-2 px-3 text-foreground text-xs font-medium">{s.name}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      s.category === 'high_demand' ? 'bg-red-500/15 text-red-400' :
                      s.category === 'fast_growing' ? 'bg-amber-500/15 text-amber-400' :
                      s.category === 'emerging' ? 'bg-violet-500/15 text-violet-400' :
                      s.category === 'stable' ? 'bg-emerald-500/15 text-emerald-400' :
                      'bg-slate-500/15 text-slate-400'
                    }`}>
                      {s.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell">{s.district_name}</td>
                  <td className="py-2 px-3 text-right text-blue-400 text-xs">{s.demand}</td>
                  <td className="py-2 px-3 text-right text-emerald-400 text-xs">{s.supply}</td>
                  <td className="py-2 px-3 text-right text-red-400 text-xs font-medium">{s.gap}</td>
                  <td className="py-2 px-3 text-right text-xs hidden md:table-cell">
                    <span className={s.growth > 15 ? 'text-emerald-400' : s.growth > 0 ? 'text-amber-400' : 'text-red-400'}>
                      {s.growth > 0 ? '+' : ''}{s.growth}%
                    </span>
                  </td>
                  <td className="py-2 px-3 hidden lg:table-cell w-24">
                    <ConfidenceIndicator value={s.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}