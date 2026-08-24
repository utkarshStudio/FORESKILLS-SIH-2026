import { buildReportDoc } from '../src/lib/reportPdf.js';

const ts = new Date().toISOString();
const reports = [
  {
    type: 'District Skill Gap Report',
    inputs: { district: 'Nashik' },
    method: 'Skill gap analysis using deterministic demand-supply calculation',
    results: {
      total_skills_tracked: 24,
      total_demand: 48200,
      total_supply: 39150,
      total_gap: 9050,
      avg_confidence: '78%',
      top_gaps: [
        { skill: 'EV Battery Systems', gap: 2100, demand: 5400, supply: 3300 },
        { skill: 'Industrial Automation', gap: 1800, demand: 4900, supply: 3100 },
        { skill: 'A very long skill name that should wrap across multiple lines in the table cell to test wrapping behaviour thoroughly', gap: 900, demand: 1500, supply: 600 },
      ],
    },
    confidence: '78%',
    evidence: ['24 skills analyzed', 'Demand-supply gap calculated', 'Data source: Reference dataset'],
    timestamp: ts,
  },
  {
    type: 'Investment Workforce Report',
    inputs: { investment: 'EV Manufacturing Plant — Nashik', district: 'Nashik', budget: '₹500Cr' },
    method: 'Investment-to-skill conversion with deterministic simulation',
    results: {
      affected_jobs: 12,
      required_skills: 18,
      workforce_requirement: 12500,
      training_seats_required: 9800,
      estimated_cost: '₹412.5Cr',
      skill_gap_reduction: '34%',
      employment_impact: 8450,
    },
    confidence: 85,
    evidence: ['Deterministic simulation', 'Reference dataset inputs'],
    timestamp: ts,
  },
  {
    type: 'Policy Simulation Report',
    inputs: { investment: 'EV Manufacturing Plant — Nashik', budget: '₹500Cr', training_target: 10000 },
    method: 'Deterministic policy simulation with scenario comparison',
    results: {
      recommended_scenario: 'Scenario B — Phased rollout across two fiscal years with district-level prioritisation',
      scenario_a_skill_gap_reduction: '28%',
      scenario_b_skill_gap_reduction: '34%',
      scenario_a_employment: 7200,
      scenario_b_employment: 8450,
      reason: 'Scenario B delivers a higher skill-gap reduction per rupee allocated while respecting seat capacity constraints in every training institute.',
    },
    confidence: 80,
    evidence: ['Both scenarios use identical inputs', 'Recommendation based on calculated metrics', 'Deterministic comparison'],
    timestamp: ts,
  },
  {
    type: 'Budget Allocation Report',
    inputs: { budget: '₹250Cr', district: 'Pune' },
    method: 'Deterministic greedy optimization — maximizes impact per ₹Cr',
    results: {
      total_allocated: '₹247.5Cr',
      remaining: '₹2.5Cr',
      training_seats: 6400,
      skill_gap_reduction: '29%',
      employment_impact: 5210,
      allocation: [
        { category: 'EV Manufacturing', amount: '₹120Cr', seats: 3200 },
        { category: 'Agri Processing', amount: '₹80Cr', seats: 2000 },
        { category: 'IT & ITeS', amount: '₹47.5Cr', seats: 1200 },
      ],
    },
    confidence: 82,
    evidence: ['Budget constraint satisfied', 'Capacity constraints respected', 'Greedy optimization by impact-per-₹Cr'],
    timestamp: ts,
  },
  {
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
    evidence: ['Mock extraction (keyword matching)', 'Compared against EV Manufacturing skill requirements'],
    timestamp: ts,
  },
];

let failures = 0;
for (const report of reports) {
  try {
    const { doc } = await buildReportDoc(report);
    const buf = doc.output('arraybuffer');
    const pages = doc.getNumberOfPages();
    const head = Buffer.from(buf.slice(0, 5)).toString();
    if (head !== '%PDF-') throw new Error(`bad header: ${head}`);
    if (!(buf.byteLength > 2000)) throw new Error('suspiciously small pdf');
    console.log(`OK  ${report.type.padEnd(32)} pages=${pages} bytes=${buf.byteLength}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${report.type}: ${err.stack || err}`);
  }
}
process.exit(failures ? 1 : 0);
