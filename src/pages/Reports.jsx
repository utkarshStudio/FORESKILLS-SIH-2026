import React, { useState } from 'react';
import { FileBarChart, Download, FileText, CheckCircle, Clock, Presentation, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { reportProvider } from '@/providers/providers';
import { DISTRICTS, INVESTMENTS } from '@/data/data';
import { runSimulation, compareScenarios, calculateDistrictSkillGaps, getTotalSkillGap } from '@/engines/engines';
import { SectionCard, DataSourceBadge } from '@/components/Common';
import { downloadReportPdf } from '@/lib/reportPdf';

const REPORT_TYPES = [
  { id: 'district_gap', label: 'District Skill Gap Report', icon: FileText, description: 'Comprehensive skill gap analysis for a selected district' },
  { id: 'investment', label: 'Investment Workforce Report', icon: FileText, description: 'Workforce impact analysis for a specific investment' },
  { id: 'curriculum', label: 'Curriculum Gap Report', icon: FileText, description: 'Curriculum alignment and gap analysis summary' },
  { id: 'policy_sim', label: 'Policy Simulation Report', icon: FileText, description: 'Full policy simulation results and recommendations' },
  { id: 'budget', label: 'Budget Allocation Report', icon: FileText, description: 'Budget optimization and allocation breakdown' },
];

/**
 * @typedef {Object} ReportData
 * @property {string} type
 * @property {Record<string, any>} inputs
 * @property {string} method
 * @property {Record<string, any>} results
 * @property {number|string} confidence
 * @property {string[]} evidence
 * @property {string} timestamp
 * @property {string} [data_source]
 */

/**
 * @typedef {Object} ExportResultData
 * @property {string} [error]
 * @property {string} [title]
 * @property {string} [url]
 * @property {string} [document_id]
 * @property {string} [presentation_id]
 * @property {number} [slide_count]
 */

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('district_gap');
  const [districtId, setDistrictId] = useState('nashik');
  const [investmentId, setInvestmentId] = useState('ev_nashik');
  const [budget, setBudget] = useState(10);
  const [generatedReport, setGeneratedReport] = useState(/** @type {ReportData|null} */ (null));
  const [generating, setGenerating] = useState(false);
  const [exportingDocs, setExportingDocs] = useState(false);
  const [exportingSlides, setExportingSlides] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportResult, setExportResult] = useState(/** @type {ExportResultData|null} */ (null));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      /** @type {ReportData|null} */
      let report = null;
      const timestamp = new Date().toISOString();

      if (selectedReport === 'district_gap') {
        const district = DISTRICTS.find(d => d.id === districtId);
        const gaps = calculateDistrictSkillGaps(districtId);
        const totals = getTotalSkillGap(districtId);
        report = {
          type: 'District Skill Gap Report',
          inputs: { district: district?.name || districtId },
          method: 'Skill gap analysis using deterministic demand-supply calculation',
          results: {
            total_skills_tracked: gaps.length,
            total_demand: totals.total_demand,
            total_supply: totals.total_supply,
            total_gap: totals.total_gap,
            avg_confidence: `${totals.avg_confidence}%`,
            top_gaps: gaps.sort((a, b) => b.gap - a.gap).slice(0, 5).map(g => ({ skill: g.skill_name, gap: g.gap, demand: g.demand, supply: g.supply })),
          },
          confidence: totals.avg_confidence,
          evidence: [`${gaps.length} skills analyzed`, `Demand-supply gap calculated`, `Data source: Reference dataset (not a live government feed)`],
          timestamp,
        };
      } else if (selectedReport === 'investment') {
        const inv = INVESTMENTS.find(i => i.id === investmentId) || INVESTMENTS[0];
        const sim = runSimulation({
          district_id: inv.district_id, industry_id: inv.industry_id, investment_id: inv.id,
          budget_cr: budget, training_target: 10000, time_horizon_months: 24, priority: 'skill_gap_reduction',
        });
        report = {
          type: 'Investment Workforce Report',
          inputs: { investment: inv.name, district: DISTRICTS.find(d => d.id === inv.district_id)?.name || 'Nashik', budget: `₹${budget}Cr` },
          method: 'Investment-to-skill conversion with deterministic simulation',
          results: {
            affected_jobs: sim.affected_occupations.length,
            required_skills: sim.required_skills.length,
            workforce_requirement: sim.workforce.workforce_requirement,
            training_seats_required: sim.workforce.training_seats_required,
            estimated_cost: `₹${sim.estimated_cost_cr}Cr`,
            skill_gap_reduction: `${sim.skill_gap_reduction_pct}%`,
            employment_impact: sim.employment_impact,
          },
          confidence: sim.confidence,
          evidence: sim.evidence,
          timestamp,
        };
      } else if (selectedReport === 'policy_sim') {
        const inv = INVESTMENTS.find(i => i.id === investmentId) || INVESTMENTS[0];
        const cmp = compareScenarios({
          district_id: inv.district_id, industry_id: inv.industry_id, investment_id: inv.id,
          budget_cr: budget, training_target: 10000, time_horizon_months: 24, priority: 'skill_gap_reduction',
        });
        report = {
          type: 'Policy Simulation Report',
          inputs: { investment: inv.name, budget: `₹${budget}Cr`, training_target: 10000 },
          method: 'Deterministic policy simulation with scenario comparison',
          results: {
            recommended_scenario: cmp.recommended_name,
            scenario_a_skill_gap_reduction: `${cmp.scenario_a.optimization.skill_gap_reduction_pct}%`,
            scenario_b_skill_gap_reduction: `${cmp.scenario_b.optimization.skill_gap_reduction_pct}%`,
            scenario_a_employment: cmp.scenario_a.optimization.employment_impact,
            scenario_b_employment: cmp.scenario_b.optimization.employment_impact,
            reason: cmp.reason,
          },
          confidence: 80,
          evidence: ['Both scenarios use identical inputs', 'Recommendation based on calculated metrics', 'Deterministic comparison'],
          timestamp,
        };
      } else if (selectedReport === 'budget') {
        const inv = INVESTMENTS.find(i => i.id === investmentId) || INVESTMENTS[0];
        const sim = runSimulation({
          district_id: inv.district_id, industry_id: inv.industry_id, investment_id: inv.id,
          budget_cr: budget, training_target: 10000, time_horizon_months: 24, priority: 'skill_gap_reduction',
        });
        report = {
          type: 'Budget Allocation Report',
          inputs: { budget: `₹${budget}Cr`, district: DISTRICTS.find(d => d.id === inv.district_id)?.name || 'Nashik' },
          method: 'Deterministic greedy optimization — maximizes impact per ₹Cr',
          results: {
            total_allocated: `₹${sim.optimization.total_allocated_cr}Cr`,
            remaining: `₹${sim.optimization.remaining_budget_cr}Cr`,
            training_seats: sim.optimization.total_seats,
            skill_gap_reduction: `${sim.skill_gap_reduction_pct}%`,
            employment_impact: sim.employment_impact,
            allocation: sim.allocation.map(a => ({ category: a.label, amount: `₹${a.amount_cr}Cr`, seats: a.seats })),
          },
          confidence: 82,
          evidence: ['Budget constraint satisfied', 'Capacity constraints respected', 'Greedy optimization by impact-per-₹Cr'],
          timestamp,
        };
      } else if (selectedReport === 'curriculum') {
        report = {
          type: 'Curriculum Gap Report',
          inputs: { program: 'Sample diploma curriculum document', target_industry: 'EV Manufacturing' },
          method: 'Mock skill extraction and ontology comparison',
          results: {
            alignment_score: '58%',
            missing_skills: ['EV Technology', 'Industrial Automation', 'Robotics', 'Embedded Systems'],
            outdated_skills: ['PHP', 'MySQL'],
            emerging_skills: ['EV Technology', 'Industrial Automation'],
            recommendations: 5,
          },
          confidence: 70,
          evidence: ['Mock extraction (keyword matching)', 'Compared against EV Manufacturing skill requirements', '4 missing, 2 outdated skills identified'],
          timestamp,
        };
      }

      setGeneratedReport(report);
      setGenerating(false);
    }, 600);
  };

  const handleDownload = async () => {
    if (!generatedReport || downloadingPdf) return;
    setDownloadingPdf(true);
    setExportResult(null);
    try {
      await downloadReportPdf(generatedReport);
    } catch (err) {
      setExportResult({ error: `PDF download failed: ${err?.message || 'unknown error'}` });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportToDocs = async () => {
    if (!generatedReport) return;
    setExportingDocs(true);
    setExportResult(null);
    const result = await reportProvider.exportToGoogleDocs(generatedReport);
    if (result.status === 'not_configured') {
      setExportResult({ error: result.message });
    } else if (result.data) {
      setExportResult(result.data);
    }
    setExportingDocs(false);
  };

  const handleExportToSlides = async () => {
    if (!generatedReport) return;
    setExportingSlides(true);
    setExportResult(null);
    const result = await reportProvider.exportToGoogleSlides(generatedReport);
    if (result.status === 'not_configured') {
      setExportResult({ error: result.message });
    } else if (result.data) {
      setExportResult(result.data);
    }
    setExportingSlides(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">Generate and export workforce intelligence reports</p>
        </div>
        <DataSourceBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Report Selection */}
        <SectionCard title="Report Configuration" icon={FileText}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report Type</label>
              <div className="space-y-1.5">
                {REPORT_TYPES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r.id)}
                    className={`w-full flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                      selectedReport === r.id ? 'bg-primary/10 border-primary/40' : 'bg-secondary/30 border-border hover:border-primary/20'
                    }`}
                  >
                    <FileText className={`w-4 h-4 mt-0.5 ${selectedReport === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-xs font-medium ${selectedReport === r.id ? 'text-primary' : 'text-foreground'}`}>{r.label}</p>
                      <p className="text-[10px] text-muted-foreground">{r.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(selectedReport === 'district_gap') && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
                <select value={districtId} onChange={e => setDistrictId(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
                  {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {(selectedReport === 'investment' || selectedReport === 'policy_sim' || selectedReport === 'budget') && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Investment</label>
                  <select value={investmentId} onChange={e => setInvestmentId(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
                    {INVESTMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget (₹Cr)</label>
                  <input type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value) || 0)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" />
                </div>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {generating ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Generating...</> : <><FileText className="w-4 h-4" /> Generate Report</>}
            </button>
          </div>
        </SectionCard>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          {generatedReport ? (
            <SectionCard
              title={generatedReport.type}
              icon={FileBarChart}
              demo
              action={
                <div className="flex items-center gap-2">
                  <button onClick={handleDownload} disabled={downloadingPdf} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 disabled:opacity-50">
                    {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
                  </button>
                  <button onClick={handleExportToDocs} disabled={exportingDocs} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 disabled:opacity-50">
                    {exportingDocs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Docs
                  </button>
                  <button onClick={handleExportToSlides} disabled={exportingSlides} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 disabled:opacity-50">
                    {exportingSlides ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />} Slides
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Inputs */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Inputs</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(generatedReport.inputs).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-secondary/30 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase">{k.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-foreground font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Method</h4>
                  <p className="text-xs text-foreground p-2.5 rounded-lg bg-secondary/20 border border-border">{generatedReport.method}</p>
                </div>

                {/* Results */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Results</h4>
                  <pre className="text-xs text-foreground p-3 rounded-lg bg-secondary/20 border border-border overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(generatedReport.results, null, 2)}
                  </pre>
                </div>

                {/* Confidence & Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-[hsl(var(--status-low))]" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Confidence</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{generatedReport.confidence}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Timestamp</span>
                    </div>
                    <p className="text-xs text-foreground">{new Date(generatedReport.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Evidence</h4>
                  <div className="space-y-1">
                    {generatedReport.evidence.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Result */}
                {exportResult && (
                  <div className={`p-3 rounded-lg border ${exportResult.error ? 'bg-[hsl(var(--status-high))]/10 border-[hsl(var(--status-high))]/30' : 'bg-[hsl(var(--status-low))]/10 border-[hsl(var(--status-low))]/30'}`}>
                    {exportResult.error ? (
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--status-high))]">
                        <AlertCircle className="w-4 h-4" />
                        <span>{exportResult.error}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--status-low))]">
                        <CheckCircle className="w-4 h-4" />
                        <span>Exported to {exportResult.title}</span>
                        <a href={exportResult.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline ml-auto">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileBarChart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a report type and click "Generate Report"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}