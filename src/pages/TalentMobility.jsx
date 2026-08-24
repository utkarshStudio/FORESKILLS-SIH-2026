import React, { useState, useMemo } from 'react';
import { MoveRight, Users, TrendingUp, MapPin } from 'lucide-react';
import { DISTRICTS, MIGRATION_DATA } from '@/data/data';
import { SectionCard, KPICard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import MaharashtraMap from '@/components/Maps';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useChartTheme } from '@/components/Charts';

export default function TalentMobility() {
  const [selectedDistrict, setSelectedDistrict] = useState('nashik');
  const { tooltipStyle, tickFill, colors: cc } = useChartTheme();

  const totals = useMemo(() => {
    const totalTrained = MIGRATION_DATA.reduce((s, m) => s + m.trained, 0);
    const totalEmployed = MIGRATION_DATA.reduce((s, m) => s + m.employed, 0);
    const totalRetained = MIGRATION_DATA.reduce((s, m) => s + m.retained, 0);
    const totalMigrated = MIGRATION_DATA.reduce((s, m) => s + m.migrated, 0);
    return {
      trained: totalTrained,
      employed: totalEmployed,
      retained: totalRetained,
      migrated: totalMigrated,
      retentionPct: Math.round((totalRetained / totalTrained) * 100),
      employmentPct: Math.round((totalEmployed / totalTrained) * 100),
      migrationPct: Math.round((totalMigrated / totalTrained) * 100),
    };
  }, []);

  const districtData = MIGRATION_DATA.find(m => m.district_id === selectedDistrict);
  const district = DISTRICTS.find(d => d.id === selectedDistrict);

  const chartData = MIGRATION_DATA.map(m => ({
    name: DISTRICTS.find(d => d.id === m.district_id)?.name,
    trained: m.trained,
    employed: m.employed,
    retained: m.retained,
    migrated: m.migrated,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MoveRight className="w-5 h-5 text-primary" />
            Talent Mobility
          </h1>
          <p className="text-sm text-muted-foreground">Track trained workforce employment, retention, and migration patterns</p>
        </div>
        <DataSourceBadge />
      </div>

      {/* Statewide KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon="users" color="cyan" label="Total Trained" value={totals.trained.toLocaleString()} />
        <KPICard icon="users" color="blue" label="Employed" value={totals.employed.toLocaleString()} sublabel={`${totals.employmentPct}% employment`} />
        <KPICard icon="retention" color="emerald" label="Retained Locally" value={totals.retained.toLocaleString()} sublabel={`${totals.retentionPct}% retention`} />
        <KPICard icon="retention" color="amber" label="Migrated Out" value={totals.migrated.toLocaleString()} sublabel={`${totals.migrationPct}% migration`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <SectionCard title="Maharashtra Talent Flow" subtitle="Click a district to view details" icon={MapPin} demo>
            <MaharashtraMap onDistrictClick={(id) => setSelectedDistrict(id)} selectedDistrictId={selectedDistrict} height={350} />
          </SectionCard>
        </div>

        {/* District Detail */}
        <SectionCard title={district?.name} subtitle="Talent mobility breakdown" icon={Users} demo>
          {districtData && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Trained</span>
                  <span className="text-sm text-foreground font-bold">{districtData.trained.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Employed</span>
                  <span className="text-sm text-blue-400 font-bold">{districtData.employed.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(districtData.employed / districtData.trained) * 100}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((districtData.employed / districtData.trained) * 100)}% employment rate</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Retained Locally</span>
                  <span className="text-sm text-emerald-400 font-bold">{districtData.retained.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(districtData.retained / districtData.trained) * 100}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((districtData.retained / districtData.trained) * 100)}% local retention</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Migrated Out</span>
                  <span className="text-sm text-amber-400 font-bold">{districtData.migrated.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(districtData.migrated / districtData.trained) * 100}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((districtData.migrated / districtData.trained) * 100)}% out-migration</p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* District Comparison Chart */}
      <SectionCard title="District Comparison" subtitle="Trained vs Employed vs Retained vs Migrated" icon={TrendingUp} demo>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 9 }} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis tick={{ fill: tickFill, fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="trained" fill={cc.accent} radius={[3, 3, 0, 0]} name="Trained" />
            <Bar dataKey="employed" fill={cc.demand} radius={[3, 3, 0, 0]} name="Employed" />
            <Bar dataKey="retained" fill={cc.supply} radius={[3, 3, 0, 0]} name="Retained" />
            <Bar dataKey="migrated" fill={cc.series[2]} radius={[3, 3, 0, 0]} name="Migrated" />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <EvidencePanel
        confidence={75}
        evidence={[
          `${MIGRATION_DATA.length} districts tracked`,
          `${totals.trained.toLocaleString()} total trained workforce`,
          `${totals.retentionPct}% average local retention`,
          `${totals.migrationPct}% average out-migration`,
        ]}
        method="Talent mobility data aggregated from seeded demo migration observations per district"
        timestamp="DEMO DATASET — Simulated migration data"
      />
    </div>
  );
}