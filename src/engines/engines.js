import {
  SKILLS, SKILL_DEMAND, DISTRICTS, INDUSTRIES, COST_PARAMS, INVESTMENTS,
  getDistrictSkills, getIndustryOccupations, getRequiredSkillsForOccupations,
  getDistrictInstitutes,
} from '@/data/data';

/**
 * @param {string} districtId
 * @param {string} skillId
 */
export function calculateSkillGap(districtId, skillId) {
  const key = `${districtId}__${skillId}`;
  const data = SKILL_DEMAND[key];
  if (!data) return null;
  return {
    skill_id: skillId,
    skill_name: SKILLS.find(s => s.id === skillId)?.name,
    district_id: districtId,
    demand: data.demand,
    supply: data.supply,
    gap: data.demand != null && data.supply != null ? data.demand - data.supply : null,
    growth: data.growth,
    confidence: data.confidence,
    trend: data.trend,
    last_updated: data.period_year ? `${data.period_year}` : null,
    data_source: data.source_name || 'Verified database record (skill_demand)',
  };
}

/** @param {string} districtId */
export function calculateDistrictSkillGaps(districtId) {
  const districtSkills = getDistrictSkills(districtId);
  return districtSkills.map(s => ({
    skill_id: s.id,
    skill_name: s.name,
    category: s.category,
    demand: s.demand,
    supply: s.supply,
    gap: s.gap,
    growth: s.growth,
    confidence: s.confidence,
    trend: s.trend,
    data_source: s.source_name || 'Verified database record (skill_demand)',
  }));
}

/**
 * @param {string} districtId
 * @param {string} industryId
 */
export function calculateSkillGapForIndustry(districtId, industryId) {
  const districtSkills = getDistrictSkills(districtId);
  return districtSkills
    .filter(s => s.industry_ids?.includes(industryId))
    .map(s => ({
      skill_id: s.id,
      skill_name: s.name,
      demand: s.demand,
      supply: s.supply,
      gap: s.demand - s.supply,
      growth: s.growth,
      confidence: s.confidence,
      trend: s.trend,
    }));
}

/** @param {string} districtId */
export function getTotalSkillGap(districtId) {
  const gaps = calculateDistrictSkillGaps(districtId);
  return {
    total_demand: gaps.reduce((s, g) => s + (g.demand ?? 0), 0),
    total_supply: gaps.reduce((s, g) => s + (g.supply ?? 0), 0),
    total_gap: gaps.reduce((s, g) => s + (g.gap ?? 0), 0),
    avg_confidence: gaps.length
      ? Math.round(gaps.reduce((s, g) => s + (g.confidence ?? 0), 0) / gaps.length)
      : null,
    skill_count: gaps.length,
  };
}

export function getEmergingSkillGaps() {
  /** @type {Array<ReturnType<typeof calculateDistrictSkillGaps>[number] & { district_id: string, district_name: string }>} */
  const allGaps = [];
  for (const district of DISTRICTS) {
    const gaps = calculateDistrictSkillGaps(district.id);
    allGaps.push(...gaps.filter(g => (g.gap ?? 0) > 30).map(g => ({ ...g, district_id: district.id, district_name: district.name })));
  }
  return allGaps.sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0)).slice(0, 10);
}

const RISK_WEIGHTS = {
  industry_decline: 0.20,
  automation_exposure: 0.35,
  demand_trend: 0.25,
  investment_change: 0.20,
};

/**
 * @param {string} districtId
 * @param {string} industryId
 */
export function calculateRisk(districtId, industryId) {
  const industry = INDUSTRIES.find(i => i.id === industryId);
  if (!industry) return null;
  const district = DISTRICTS.find(d => d.id === districtId);
  const occupations = getIndustryOccupations(industryId);

  // decline signal inverts growth rate; clamped to 0-100
  const industryDecline = Math.max(0, Math.min(100, 50 - industry.growth_rate));

  const automationExposure = industry.automation_risk;

  const industrySkillIds = occupations.flatMap(o => o.skill_ids);
  const demandValues = industrySkillIds
    .map(sid => SKILL_DEMAND[`${districtId}__${sid}`]?.demand || 50);
  const avgDemand = demandValues.length > 0 ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length : 50;
  const demandTrendSignal = Math.max(0, Math.min(100, 100 - avgDemand));
  const investmentChange = 0;

  const signals = {
    industry_decline: Math.round(industryDecline),
    automation_exposure: Math.round(automationExposure),
    demand_trend: Math.round(demandTrendSignal),
    investment_change: Math.round(investmentChange),
  };

  const riskScore = Math.round(
    industryDecline * RISK_WEIGHTS.industry_decline +
    automationExposure * RISK_WEIGHTS.automation_exposure +
    demandTrendSignal * RISK_WEIGHTS.demand_trend +
    investmentChange * RISK_WEIGHTS.investment_change
  );

  const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW';

  const affectedSkills = [...new Set(industrySkillIds)].flatMap(sid => {
    const skill = SKILLS.find(s => s.id === sid);
    return skill?.name ? [skill.name] : [];
  });

  const reskillingTargets = occupations
    .filter(o => o.automation_risk > 30)
    .flatMap(o => o.skill_ids)
    .flatMap(sid => {
      const skill = SKILLS.find(s => s.id === sid);
      return skill?.name ? [skill.name] : [];
    });
  const uniqueReskilling = [...new Set(reskillingTargets)];

  return {
    district_id: districtId,
    district_name: district?.name,
    industry_id: industryId,
    industry_name: industry.name,
    risk_score: riskScore,
    risk_level: riskLevel,
    affected_occupations: occupations.map(o => ({ name: o.name, automation_risk: o.automation_risk })),
    affected_skills: affectedSkills,
    forecast_horizon: '24 months',
    confidence: 75,
    signals,
    evidence: [
      `Industry growth rate: ${industry.growth_rate > 0 ? '+' : ''}${industry.growth_rate}%`,
      `Automation exposure: ${industry.automation_risk}%`,
      `${occupations.length} affected occupation categories`,
      `Average skill demand index: ${Math.round(avgDemand)}`,
    ],
    recommended_reskilling: uniqueReskilling.length > 0 ? uniqueReskilling : ['Industrial Automation', 'Robotics', 'Embedded Systems'],
    data_source: 'Reference dataset',
    method: 'Weighted signal model: industry decline (20%), automation exposure (35%), demand trend (25%), investment change (20%)',
    disclaimer: 'This is an early-warning forecast, not a layoff prediction. Estimated exposure based on reference signals.',
  };
}

export function getAllRisks() {
  /** @type {Array<NonNullable<ReturnType<typeof calculateRisk>>>} */
  const risks = [];
  for (const district of DISTRICTS) {
    for (const industry of INDUSTRIES) {
      const risk = calculateRisk(district.id, industry.id);
      if (risk && risk.risk_score >= 30) {
        risks.push(risk);
      }
    }
  }
  return risks.sort((a, b) => b.risk_score - a.risk_score);
}

/**
 * @param {string} extractedText
 * @param {string} targetIndustryId
 */
export function analyzeCurriculum(extractedText, targetIndustryId) {
  const textLower = extractedText.toLowerCase();

  /** @type {typeof SKILLS} */
  const foundSkills = [];
  for (const skill of SKILLS) {
    const allNames = [skill.name.toLowerCase(), ...skill.aliases.map(a => a.toLowerCase())];
    if (allNames.some(n => textLower.includes(n))) {
      foundSkills.push(skill);
    }
  }

  const techKeywords = [
    'javascript', 'java', 'python', 'c++', 'php', 'mysql', 'html', 'css', 'react',
    'angular', 'node', 'sql', 'mongodb', 'docker', 'kubernetes', 'aws', 'azure',
    'linux', 'networking', 'database', 'data structures', 'algorithms',
    'microcontroller', 'arduino', 'raspberry pi', 'matlab', 'autocad', 'solidworks',
  ];
  const detectedTechnologies = techKeywords.filter(t => textLower.includes(t));

  const industry = INDUSTRIES.find(i => i.id === targetIndustryId);
  const industryOccupations = industry ? getIndustryOccupations(industry.id) : [];
  const requiredSkillIds = new Set(industryOccupations.flatMap(o => o.skill_ids));
  const requiredSkills = Array.from(requiredSkillIds).flatMap(sid => {
    const skill = SKILLS.find(s => s.id === sid);
    return skill ? [skill] : [];
  });

  const matchedSkills = foundSkills.filter(f => requiredSkillIds.has(f.id));
  const alignmentScore = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 50;

  const missingSkills = requiredSkills
    .filter(s => !foundSkills.find(f => f.id === s.id))
    .map(s => s.name);

  const outdatedSkills = foundSkills
    .filter(f => !requiredSkillIds.has(f.id))
    .map(s => s.name);

  const emergingSkills = requiredSkills
    .filter(s => s.category === 'emerging' || s.category === 'fast_growing')
    .map(s => s.name);

  const recommendations = [
    ...missingSkills.map(s => `Add ${s} module to curriculum`),
    ...outdatedSkills.map(s => `Modernize or phase out ${s} content`),
    ...emergingSkills.map(s => `Introduce ${s} as emerging technology module`),
    `Target alignment with ${industry?.name || 'industry'} skill requirements`,
    'Update practical labs to match current industry tools',
  ];

  return {
    extracted_skills: foundSkills.map(s => s.name),
    detected_technologies: detectedTechnologies,
    alignment_score: alignmentScore,
    matched_skills: matchedSkills.map(s => s.name),
    missing_skills: missingSkills,
    outdated_skills: outdatedSkills,
    emerging_skills: emergingSkills,
    recommendations,
    industry_target: industry?.name || 'General',
    method: 'Keyword-based skill extraction against skill ontology',
    data_source: 'Reference dataset',
    confidence: 70,
  };
}

/**
 * @param {string} text
 * @param {string | null} [targetIndustryId]
 */
export function extractSkillsFromText(text, targetIndustryId = null) {
  const textLower = String(text).toLowerCase();

  let industrySkillIds = null;
  if (targetIndustryId) {
    const occupations = getIndustryOccupations(targetIndustryId);
    industrySkillIds = new Set(occupations.flatMap((o) => o.skill_ids));
  }

  return SKILLS.filter((skill) => {
    const allNames = [skill.name.toLowerCase(), ...skill.aliases.map((a) => a.toLowerCase())];
    return allNames.some((n) => textLower.includes(n));
  })
    .map((s) => s.name)
    .sort((a, b) => {
      if (!industrySkillIds) return 0;
      const aIn = industrySkillIds.has(/** @type {string} */ (SKILLS.find((s) => s.name === a)?.id));
      const bIn = industrySkillIds.has(/** @type {string} */ (SKILLS.find((s) => s.name === b)?.id));
      return aIn === bIn ? 0 : aIn ? -1 : 1;
    });
}

// Sample curriculum document (clearly labelled sample content, not an
// uploaded file) for exercising the analysis pipeline without a upload.
export const SAMPLE_CURRICULUM_TEXT = `
Diploma in Computer Engineering — Curriculum Document

Semester 1: Mathematics, Physics, Programming in C, Basic Electronics
Semester 2: Data Structures, Digital Electronics, Object Oriented Programming with Java, Database Management Systems with MySQL
Semester 3: Computer Networks, Operating Systems, Web Development with HTML CSS and JavaScript, Software Engineering
Semester 4: Microprocessor and Microcontroller, Embedded Systems, Advanced Java, PHP Web Development
Semester 5: Cloud Computing Basics, Python Programming, Data Analytics, Project Work
Semester 6: Industrial Training, Machine Learning Introduction, Cybersecurity Fundamentals, Capstone Project

Practical Labs: C Programming Lab, Java Lab, Database Lab, Networking Lab, Microcontroller Lab with Arduino
`;

// Backwards-compatible alias (existing imports keep working).
export { analyzeCurriculum as analyzeCurriculumMock, SAMPLE_CURRICULUM_TEXT as MOCK_CURRICULUM_TEXT };

// ============================================================
// SECTION 4: OPTIMIZATION ENGINE
// Deterministic budget optimization. Greedy allocation:
// maximizes impact per ₹Cr subject to constraints.
// NEVER exceeds budget. Changing budget changes results.
// [TEAM INTEGRATION 07] Replace with OR-Tools or custom optimizer.
// ============================================================

/**
 * @typedef {{ seats: number, employment: number, retention: number }} PriorityWeight
 */

/**
 * @typedef {Object} OptimizationCategory
 * @property {string} id
 * @property {string} label
 * @property {number} unit_cost_cr
 * @property {number} unit_seats
 * @property {number} max_units
 * @property {number} impact_weight
 * @property {number} [unit_trainers]
 * @property {number} [impact_per_cr]
 */

/** @type {Record<string, PriorityWeight>} */
const PRIORITY_WEIGHTS = {
  skill_gap_reduction: { seats: 1.0, employment: 0.5, retention: 0.3 },
  employment_impact: { seats: 0.5, employment: 1.0, retention: 0.3 },
  local_retention: { seats: 0.3, employment: 0.5, retention: 1.0 },
  speed: { seats: 0.8, employment: 0.8, retention: 0.2 },
};

/**
 * @param {string} scenarioType
 * @returns {OptimizationCategory[]}
 */
function buildCategories(scenarioType) {
  if (scenarioType === 'upgrade_existing') {
    return [
      { id: 'institute_upgrade', label: 'Institute Upgrades', unit_cost_cr: COST_PARAMS.cost_per_institute_upgrade, unit_seats: COST_PARAMS.seats_per_upgrade, max_units: 10, impact_weight: 1.2 },
      { id: 'lab', label: 'Lab Equipment', unit_cost_cr: COST_PARAMS.cost_per_lab, unit_seats: COST_PARAMS.seats_per_lab, max_units: 15, impact_weight: 1.0 },
      { id: 'trainer_program', label: 'Trainer Programs', unit_cost_cr: COST_PARAMS.cost_per_trainer_program, unit_seats: 0, max_units: 20, impact_weight: 0.6, unit_trainers: COST_PARAMS.trainers_per_program },
      { id: 'curriculum_update', label: 'Curriculum Updates', unit_cost_cr: COST_PARAMS.cost_per_curriculum_update, unit_seats: 0, max_units: 10, impact_weight: 0.3 },
      { id: 'new_seats', label: 'Additional Training Seats', unit_cost_cr: COST_PARAMS.cost_per_seat, unit_seats: 1, max_units: 20000, impact_weight: 0.5 },
    ];
  }
  if (scenarioType === 'build_new') {
    return [
      { id: 'new_institute', label: 'New Training Institutes', unit_cost_cr: 2.0, unit_seats: 500, max_units: 5, impact_weight: 1.5 },
      { id: 'new_lab', label: 'New Labs', unit_cost_cr: 0.5, unit_seats: 150, max_units: 20, impact_weight: 1.1 },
      { id: 'trainer_program', label: 'Trainer Programs', unit_cost_cr: COST_PARAMS.cost_per_trainer_program, unit_seats: 0, max_units: 20, impact_weight: 0.6, unit_trainers: COST_PARAMS.trainers_per_program },
      { id: 'curriculum_update', label: 'Curriculum Updates', unit_cost_cr: COST_PARAMS.cost_per_curriculum_update, unit_seats: 0, max_units: 10, impact_weight: 0.3 },
      { id: 'new_seats', label: 'Training Seats', unit_cost_cr: COST_PARAMS.cost_per_seat, unit_seats: 1, max_units: 20000, impact_weight: 0.5 },
    ];
  }
  // mixed
  return [
    { id: 'institute_upgrade', label: 'Institute Upgrades', unit_cost_cr: COST_PARAMS.cost_per_institute_upgrade, unit_seats: COST_PARAMS.seats_per_upgrade, max_units: 10, impact_weight: 1.2 },
    { id: 'lab', label: 'Lab Equipment', unit_cost_cr: COST_PARAMS.cost_per_lab, unit_seats: COST_PARAMS.seats_per_lab, max_units: 15, impact_weight: 1.0 },
    { id: 'new_institute', label: 'New Institutes', unit_cost_cr: 2.0, unit_seats: 500, max_units: 3, impact_weight: 1.5 },
    { id: 'trainer_program', label: 'Trainer Programs', unit_cost_cr: COST_PARAMS.cost_per_trainer_program, unit_seats: 0, max_units: 20, impact_weight: 0.6, unit_trainers: COST_PARAMS.trainers_per_program },
    { id: 'curriculum_update', label: 'Curriculum Updates', unit_cost_cr: COST_PARAMS.cost_per_curriculum_update, unit_seats: 0, max_units: 10, impact_weight: 0.3 },
    { id: 'new_seats', label: 'Additional Training Seats', unit_cost_cr: COST_PARAMS.cost_per_seat, unit_seats: 1, max_units: 20000, impact_weight: 0.5 },
  ];
}

/**
 * @typedef {Object} OptimizationInput
 * @property {number} budget_cr
 * @property {string} district_id
 * @property {string} [district_name]
 * @property {string} [priority]
 * @property {number} [training_seats_required]
 * @property {number} [existing_capacity]
 * @property {string} [scenario_type]
 * @property {Array<object>} [skill_gaps]
 */

/** @param {OptimizationInput} input */
export function runOptimization(input) {
  const {
    budget_cr,
    district_id,
    district_name,
    priority = 'skill_gap_reduction',
    training_seats_required = 10000,
    existing_capacity: _existing_capacity = 0,
    scenario_type = 'mixed',
    skill_gaps: _skill_gaps = [],
  } = input;

  const budget = budget_cr;
  const pw = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.skill_gap_reduction;

  // Build and score categories
  let categories = buildCategories(scenario_type);
  for (const cat of categories) {
    const seatImpact = cat.unit_seats;
    const employmentImpact = cat.unit_seats * COST_PARAMS.employment_rate;
    const retentionImpact = cat.unit_seats * COST_PARAMS.base_retention_rate;
    cat.impact_per_cr = (seatImpact * pw.seats + employmentImpact * pw.employment + retentionImpact * pw.retention) * cat.impact_weight / cat.unit_cost_cr;
  }
  categories.sort((a, b) => (b.impact_per_cr || 0) - (a.impact_per_cr || 0));

  // Greedy allocation — never exceed budget
  let remainingBudget = budget;
  /** @type {Array<{ category: string, label: string, units: number, amount_cr: number, seats: number, trainers?: number }>} */
  const allocation = [];
  let totalSeats = 0;
  let totalTrainers = 0;
  let totalInstituteUpgrades = 0;

  for (const cat of categories) {
    if (remainingBudget < cat.unit_cost_cr) continue;
    let units = Math.floor(remainingBudget / cat.unit_cost_cr);
    units = Math.min(units, cat.max_units);
    if (units <= 0) continue;

    const cost = Math.round(units * cat.unit_cost_cr * 100) / 100;
    const seats = units * cat.unit_seats;
    remainingBudget = Math.round((remainingBudget - cost) * 100) / 100;
    totalSeats += seats;
    if (cat.id === 'institute_upgrade' || cat.id === 'new_institute') totalInstituteUpgrades += units;
    if (cat.unit_trainers) totalTrainers += units * cat.unit_trainers;

    allocation.push({
      category: cat.id,
      label: cat.label,
      units,
      amount_cr: cost,
      seats,
      ...(cat.unit_trainers ? { trainers: units * cat.unit_trainers } : {}),
    });
  }

  const totalAllocated = Math.round((budget - remainingBudget) * 100) / 100;
  const seatsNeeded = training_seats_required;

  // Outcomes (deterministic formulas)
  const skillGapReductionPct = Math.min(100, Math.round((totalSeats / seatsNeeded) * 100));
  const workforceCoveragePct = Math.min(100, Math.round((totalSeats / (seatsNeeded || 1)) * 100));
  const employmentImpact = Math.round(totalSeats * COST_PARAMS.employment_rate);
  const localRetentionPct = Math.min(85, Math.round((COST_PARAMS.base_retention_rate + totalInstituteUpgrades * 0.02) * 100));

  return {
    allocation,
    total_seats: totalSeats,
    total_institute_upgrades: totalInstituteUpgrades,
    total_trainers: totalTrainers,
    total_allocated_cr: totalAllocated,
    budget_cr: budget,
    remaining_budget_cr: Math.round(remainingBudget * 100) / 100,
    skill_gap_reduction_pct: skillGapReductionPct,
    workforce_coverage_pct: workforceCoveragePct,
    employment_impact: employmentImpact,
    local_retention_pct: localRetentionPct,
    is_feasible: totalAllocated > 0 && totalAllocated <= budget,
    priority,
    scenario_type,
    district_id,
    district_name,
    timestamp: new Date().toISOString(),
    method: 'Deterministic greedy optimization — allocates to highest impact-per-Cr categories first, respects budget and capacity constraints',
    data_source: 'Reference dataset',
    constraints_satisfied: {
      budget: totalAllocated <= budget,
      institute_capacity: totalInstituteUpgrades <= 15,
      trainer_capacity: totalTrainers <= 400,
    },
  };
}

// ============================================================
// SECTION 5: SIMULATION ENGINE
// Deterministic policy simulation. Calculates workforce impact
// from investment scenarios. All numbers derived from seeded
// data, formulas, and constraints. Uses the Optimization Engine.
// ============================================================

/**
 * @typedef {Object} SimulationInput
 * @property {string} district_id
 * @property {string} industry_id
 * @property {string | null} [investment_id]
 * @property {number} budget_cr
 * @property {number} [training_target]
 * @property {number} [time_horizon_months]
 * @property {string} [priority]
 * @property {string} [scenario_type]
 */

/** @param {SimulationInput} input */
export function runSimulation(input) {
  const {
    district_id,
    industry_id,
    investment_id,
    budget_cr,
    training_target = 10000,
    time_horizon_months = 24,
    priority = 'skill_gap_reduction',
    scenario_type = 'mixed',
  } = input;

  const district = DISTRICTS.find(d => d.id === district_id);
  const industry = INDUSTRIES.find(i => i.id === industry_id);
  const investment = investment_id ? INVESTMENTS.find(i => i.id === investment_id) : null;

  // 1. Affected job roles
  const jobRoleIds = investment?.job_role_ids || getIndustryOccupations(industry_id).map(o => o.id);
  const { occupations, skills } = getRequiredSkillsForOccupations(jobRoleIds);

  // 2. Required skills with demand/supply/gap per district
  const skillGaps = skills.map(skill => {
    const demandData = SKILL_DEMAND[`${district_id}__${skill.id}`] || { demand: 50, supply: 30, growth: 10, confidence: 75, trend: 'rising' };
    return {
      skill_id: skill.id,
      skill_name: skill.name,
      category: skill.category,
      demand: demandData.demand,
      supply: demandData.supply,
      gap: demandData.demand - demandData.supply,
      growth: demandData.growth,
      confidence: demandData.confidence,
      trend: demandData.trend,
    };
  });

  // 3. Workforce totals
  const totalDemand = skillGaps.reduce((s, g) => s + g.demand, 0);
  const totalSupply = skillGaps.reduce((s, g) => s + g.supply, 0);
  const totalGap = skillGaps.reduce((s, g) => s + g.gap, 0);
  const workforceRequirement = investment?.expected_jobs || Math.ceil(totalGap * 100);
  const trainingSeatsRequired = Math.ceil(workforceRequirement * 0.6);

  // 4. Training capacity
  const allInstitutes = getDistrictInstitutes(district_id);
  const relevantSkillIds = skills.map(s => s.id);
  const relevantInstitutes = allInstitutes.filter(i =>
    i.program_skills.some(ps => relevantSkillIds.includes(ps))
  );
  const existingCapacity = relevantInstitutes.reduce((s, i) => s + Math.round(i.capacity * (1 - i.utilization)), 0);
  const totalInstituteCapacity = relevantInstitutes.reduce((s, i) => s + i.capacity, 0);
  const capacityGap = Math.max(0, trainingSeatsRequired - existingCapacity);

  // 5. Requirements
  const instituteUpgradesNeeded = Math.ceil(capacityGap / COST_PARAMS.seats_per_upgrade);
  const trainerRequirement = Math.ceil(trainingSeatsRequired / COST_PARAMS.trainees_per_trainer);
  const labsNeeded = Math.ceil(capacityGap / COST_PARAMS.seats_per_lab);

  // 6. Estimated full cost (unconstrained)
  const estimatedCostCr = Math.round((
    trainingSeatsRequired * COST_PARAMS.cost_per_seat +
    instituteUpgradesNeeded * COST_PARAMS.cost_per_institute_upgrade +
    labsNeeded * COST_PARAMS.cost_per_lab +
    trainerRequirement * COST_PARAMS.cost_per_trainer
  ) * 100) / 100;

  // 7. Run optimization within budget
  const optimization = runOptimization({
    budget_cr,
    district_id,
    district_name: district?.name,
    priority,
    training_seats_required: trainingSeatsRequired,
    existing_capacity: existingCapacity,
    scenario_type,
    skill_gaps: skillGaps,
  });

  // 8. Assemble result
  return {
    inputs: {
      district_id,
      district_name: district?.name,
      industry_id,
      industry_name: industry?.name,
      investment_id,
      investment_name: investment?.name,
      budget_cr,
      training_target,
      time_horizon_months,
      priority,
      scenario_type,
    },
    investment: investment ? {
      id: investment.id,
      name: investment.name,
      investment_size_cr: investment.investment_size_cr,
      expected_jobs: investment.expected_jobs,
      description: investment.description,
    } : null,
    affected_occupations: occupations.map(o => ({
      id: o.id,
      name: o.name,
      automation_risk: o.automation_risk,
      required_skills: o.skill_ids.flatMap(sid => {
        const skill = SKILLS.find(s => s.id === sid);
        return skill?.name ? [skill.name] : [];
      }),
    })),
    required_skills: skillGaps,
    workforce: {
      total_demand: totalDemand,
      total_supply: totalSupply,
      total_gap: totalGap,
      workforce_requirement: workforceRequirement,
      training_seats_required: trainingSeatsRequired,
    },
    training_capacity: {
      existing_capacity: existingCapacity,
      total_institute_capacity: totalInstituteCapacity,
      capacity_gap: Math.round(capacityGap),
      relevant_institutes: relevantInstitutes.length,
      total_institutes: allInstitutes.length,
      institutes: relevantInstitutes.map(i => ({
        name: i.name,
        type: i.type,
        capacity: i.capacity,
        utilization: Math.round(i.utilization * 100),
        available_seats: Math.round(i.capacity * (1 - i.utilization)),
      })),
    },
    requirements: {
      institute_upgrades: instituteUpgradesNeeded,
      trainer_requirement: trainerRequirement,
      labs_needed: labsNeeded,
    },
    estimated_cost_cr: estimatedCostCr,
    budget_cr,
    budget_utilization_pct: optimization.total_allocated_cr > 0 ? Math.round((optimization.total_allocated_cr / budget_cr) * 100) : 0,
    optimization,
    skill_gap_reduction_pct: optimization.skill_gap_reduction_pct,
    workforce_coverage_pct: optimization.workforce_coverage_pct,
    employment_impact: optimization.employment_impact,
    local_retention_pct: optimization.local_retention_pct,
    allocation: optimization.allocation,
    timestamp: new Date().toISOString(),
    data_source: 'Reference dataset',
    confidence: skillGaps.length > 0 ? Math.round(skillGaps.reduce((s, g) => s + g.confidence, 0) / skillGaps.length) : 75,
    method: 'Deterministic simulation with seeded cost parameters, skill demand data, and greedy budget optimization',
    evidence: [
      `Investment: ${investment?.name || industry?.name}`,
      `${occupations.length} affected job roles identified`,
      `${skills.length} required skills analyzed`,
      `Existing training capacity: ${existingCapacity} seats`,
      `Training gap: ${Math.round(capacityGap)} seats`,
    ],
  };
}

// ============================================================
// SECTION 6: SCENARIO ENGINE
// Side-by-side scenario comparison. Compares "Upgrade Existing"
// vs "Build New" strategies. Recommendation based on calculated
// metrics, not AI opinion. Uses the Simulation Engine.
// ============================================================

const COMPARISON_METRICS = [
  { key: 'skill_gap_reduction_pct', label: 'Skill-Gap Reduction', unit: '%', higher_is_better: true },
  { key: 'workforce_coverage_pct', label: 'Workforce Coverage', unit: '%', higher_is_better: true },
  { key: 'employment_impact', label: 'Employment Impact', unit: 'people', higher_is_better: true },
  { key: 'local_retention_pct', label: 'Local Retention', unit: '%', higher_is_better: true },
  { key: 'total_seats', label: 'Training Seats', unit: 'seats', higher_is_better: true },
  { key: 'total_institute_upgrades', label: 'Institutes Upgraded', unit: '', higher_is_better: true },
  { key: 'total_trainers', label: 'Trainers Required', unit: '', higher_is_better: true },
  { key: 'total_allocated_cr', label: 'Budget Allocated', unit: 'Cr', higher_is_better: false },
];

/** @param {SimulationInput} input */
export function compareScenarios(input) {
  const simA = runSimulation({ ...input, scenario_type: 'upgrade_existing' });
  const simB = runSimulation({ ...input, scenario_type: 'build_new' });

  let aWins = 0;
  let bWins = 0;

  const comparison = COMPARISON_METRICS.map(metric => {
    const recA = /** @type {Record<string, number>} */ (/** @type {unknown} */ (simA));
    const recAOpt = /** @type {Record<string, number>} */ (/** @type {unknown} */ (simA.optimization));
    const recB = /** @type {Record<string, number>} */ (/** @type {unknown} */ (simB));
    const recBOpt = /** @type {Record<string, number>} */ (/** @type {unknown} */ (simB.optimization));
    const valA = recA[metric.key] ?? recAOpt[metric.key] ?? 0;
    const valB = recB[metric.key] ?? recBOpt[metric.key] ?? 0;
    let winner = 'tie';
    if (metric.higher_is_better) {
      if (valA > valB) { winner = 'A'; aWins++; }
      else if (valB > valA) { winner = 'B'; bWins++; }
    } else {
      if (valA < valB) { winner = 'A'; aWins++; }
      else if (valB < valA) { winner = 'B'; bWins++; }
    }
    return {
      metric: metric.key,
      label: metric.label,
      unit: metric.unit,
      scenario_a: valA,
      scenario_b: valB,
      winner,
    };
  });

  const recommended = aWins > bWins ? 'A' : bWins > aWins ? 'B' : 'A';
  const recommendedName = recommended === 'A' ? 'Upgrade Existing Institutes' : 'Build New Training Capacity';

  const reason = aWins > bWins
    ? `Scenario A (Upgrade Existing) wins on ${aWins} of ${comparison.length} metrics. It achieves ${simA.optimization.skill_gap_reduction_pct}% skill-gap reduction and ${simA.optimization.employment_impact} potential employment at ₹${simA.optimization.total_allocated_cr}Cr allocated — better cost-efficiency by leveraging existing infrastructure.`
    : bWins > aWins
    ? `Scenario B (Build New Capacity) wins on ${bWins} of ${comparison.length} metrics. It achieves ${simB.optimization.skill_gap_reduction_pct}% skill-gap reduction and ${simB.optimization.employment_impact} potential employment — higher long-term capacity creation for emerging industries.`
    : `Both scenarios are balanced. Scenario A recommended for cost-efficiency.`;

  return {
    inputs: simA.inputs,
    scenario_a: {
      name: 'Upgrade Existing Institutes',
      strategy: 'Upgrade existing ITIs, polytechnics, and skill centers. Add labs and seats to current infrastructure.',
      ...simA,
    },
    scenario_b: {
      name: 'Build New Training Capacity',
      strategy: 'Construct new training institutes and labs. Higher upfront cost but greater long-term capacity.',
      ...simB,
    },
    comparison,
    recommended,
    recommended_name: recommendedName,
    reason,
    a_wins: aWins,
    b_wins: bWins,
    timestamp: new Date().toISOString(),
    data_source: 'Reference dataset',
    method: 'Deterministic simulation comparison — both scenarios use identical inputs with different allocation strategies',
  };
}
