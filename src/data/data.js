export const COST_PARAMS = {
  cost_per_seat: 0.00015,       // ₹15,000 per training seat (in Cr)
  cost_per_institute_upgrade: 0.5,  // ₹50 Lakh per institute upgrade (in Cr)
  cost_per_lab: 0.25,           // ₹25 Lakh per lab (in Cr)
  cost_per_trainer: 0.01,       // ₹1 Lakh per trainer (in Cr)
  cost_per_trainer_program: 0.05, // ₹5 Lakh per trainer training program (in Cr)
  cost_per_curriculum_update: 0.1, // ₹10 Lakh per curriculum update (in Cr)
  seats_per_upgrade: 200,
  seats_per_lab: 100,
  trainees_per_trainer: 25,
  trainers_per_program: 20,
  employment_rate: 0.72,
  base_retention_rate: 0.58,
};

// districts
export const DISTRICTS = [
  {
    id: 'nashik',
    coords: { lat: 19.9975, lng: 73.7898 },
    name: 'Nashik',
    region: 'North Maharashtra',
    population: 6500000,
    workforce: 2800000,
    employed: 2100000,
    unemployed: 700000,
    mapX: 28, mapY: 42,
    major_industry_ids: ['ev', 'adv_manufacturing', 'logistics'],
    iti_count: 14,
    polytechnic_count: 6,
    engineering_colleges: 12,
  },
  {
    id: 'pune',
    coords: { lat: 18.5204, lng: 73.8567 },
    name: 'Pune',
    region: 'Western Maharashtra',
    population: 9400000,
    workforce: 4200000,
    employed: 3400000,
    unemployed: 800000,
    mapX: 30, mapY: 52,
    major_industry_ids: ['it_digital', 'ai_cloud', 'adv_manufacturing'],
    iti_count: 22,
    polytechnic_count: 10,
    engineering_colleges: 28,
  },
  {
    id: 'nagpur',
    coords: { lat: 21.1458, lng: 79.0882 },
    name: 'Nagpur',
    region: 'Vidarbha',
    population: 5300000,
    workforce: 2300000,
    employed: 1700000,
    unemployed: 600000,
    mapX: 72, mapY: 38,
    major_industry_ids: ['logistics', 'semiconductor', 'it_digital'],
    iti_count: 12,
    polytechnic_count: 5,
    engineering_colleges: 8,
  },
  {
    id: 'mumbai',
    coords: { lat: 19.0760, lng: 72.8777 },
    name: 'Mumbai',
    region: 'Konkan',
    population: 12500000,
    workforce: 5800000,
    employed: 4900000,
    unemployed: 900000,
    mapX: 12, mapY: 62,
    major_industry_ids: ['it_digital', 'ai_cloud', 'logistics'],
    iti_count: 18,
    polytechnic_count: 8,
    engineering_colleges: 15,
  },
  {
    id: 'thane',
    coords: { lat: 19.2183, lng: 72.9781 },
    name: 'Thane',
    region: 'Konkan',
    population: 9800000,
    workforce: 4100000,
    employed: 3500000,
    unemployed: 600000,
    mapX: 18, mapY: 60,
    major_industry_ids: ['it_digital', 'adv_manufacturing', 'logistics'],
    iti_count: 16,
    polytechnic_count: 7,
    engineering_colleges: 14,
  },
  {
    id: 'kolhapur',
    coords: { lat: 16.7050, lng: 74.2433 },
    name: 'Kolhapur',
    region: 'Western Maharashtra',
    population: 4400000,
    workforce: 1900000,
    employed: 1450000,
    unemployed: 450000,
    mapX: 24, mapY: 72,
    major_industry_ids: ['adv_manufacturing', 'ev', 'logistics'],
    iti_count: 10,
    polytechnic_count: 4,
    engineering_colleges: 6,
  },
  {
    id: 'csambhajinagar',
    coords: { lat: 19.8762, lng: 75.3433 },
    name: 'Chhatrapati Sambhajinagar',
    region: 'Marathwada',
    population: 3900000,
    workforce: 1700000,
    employed: 1250000,
    unemployed: 450000,
    mapX: 44, mapY: 48,
    major_industry_ids: ['adv_manufacturing', 'semiconductor', 'logistics'],
    iti_count: 9,
    polytechnic_count: 4,
    engineering_colleges: 5,
  },
];

// industries
export const INDUSTRIES = [
  { id: 'ev', name: 'EV Manufacturing', growth_rate: 22, automation_risk: 15, emerging: true, color: '#3b82f6' },
  { id: 'adv_manufacturing', name: 'Advanced Manufacturing', growth_rate: 8, automation_risk: 45, emerging: false, color: '#f59e0b' },
  { id: 'semiconductor', name: 'Semiconductor', growth_rate: 35, automation_risk: 20, emerging: true, color: '#8b5cf6' },
  { id: 'it_digital', name: 'IT / Digital', growth_rate: 12, automation_risk: 25, emerging: false, color: '#06b6d4' },
  { id: 'logistics', name: 'Logistics', growth_rate: 6, automation_risk: 55, emerging: false, color: '#10b981' },
  { id: 'ai_cloud', name: 'AI / Cloud', growth_rate: 28, automation_risk: 10, emerging: true, color: '#6366f1' },
];

// skills
export const SKILLS = [
  { id: 'ev_tech', name: 'EV Technology', category: 'high_demand', aliases: ['Electric Vehicle Technology', 'EV Systems'], parent: null, related: ['embedded', 'industrial_automation'], industry_ids: ['ev'], confidence: 82, growth: 22 },
  { id: 'industrial_automation', name: 'Industrial Automation', category: 'high_demand', aliases: ['PLC', 'Automation', 'SCADA'], parent: null, related: ['robotics', 'ev_tech'], industry_ids: ['ev', 'adv_manufacturing'], confidence: 78, growth: 18 },
  { id: 'robotics', name: 'Robotics', category: 'fast_growing', aliases: ['Robotic Systems', 'Robot Programming'], parent: null, related: ['industrial_automation', 'embedded'], industry_ids: ['ev', 'adv_manufacturing', 'semiconductor'], confidence: 75, growth: 20 },
  { id: 'embedded', name: 'Embedded Systems', category: 'high_demand', aliases: ['Embedded', 'Firmware', 'Microcontrollers'], parent: null, related: ['ev_tech', 'robotics'], industry_ids: ['ev', 'semiconductor', 'adv_manufacturing'], confidence: 80, growth: 15 },
  { id: 'semi_testing', name: 'Semiconductor Testing', category: 'emerging', aliases: ['Chip Testing', 'VLSI Testing', 'Semiconductor Validation'], parent: null, related: ['embedded'], industry_ids: ['semiconductor'], confidence: 70, growth: 35 },
  { id: 'ai', name: 'AI', category: 'high_demand', aliases: ['Artificial Intelligence', 'AI/ML'], parent: null, related: ['ml', 'data_analytics', 'python'], industry_ids: ['ai_cloud', 'it_digital'], confidence: 85, growth: 28 },
  { id: 'ml', name: 'Machine Learning', category: 'high_demand', aliases: ['ML', 'Machine-Learning', 'Deep Learning'], parent: 'ai', related: ['ai', 'data_analytics', 'python'], industry_ids: ['ai_cloud', 'it_digital'], confidence: 83, growth: 26 },
  { id: 'cloud', name: 'Cloud Computing', category: 'high_demand', aliases: ['AWS', 'Azure', 'GCP', 'Cloud'], parent: null, related: ['devops', 'ai_cloud'], industry_ids: ['ai_cloud', 'it_digital'], confidence: 84, growth: 24 },
  { id: 'data_analytics', name: 'Data Analytics', category: 'fast_growing', aliases: ['Data Analysis', 'Analytics', 'BI'], parent: null, related: ['python', 'ml'], industry_ids: ['it_digital', 'ai_cloud'], confidence: 80, growth: 19 },
  { id: 'cybersecurity', name: 'Cybersecurity', category: 'high_demand', aliases: ['Security', 'InfoSec', 'Cyber Security'], parent: null, related: ['cloud', 'devops'], industry_ids: ['it_digital', 'ai_cloud'], confidence: 79, growth: 21 },
  { id: 'devops', name: 'DevOps', category: 'fast_growing', aliases: ['CI/CD', 'Docker', 'Kubernetes'], parent: null, related: ['cloud', 'python'], industry_ids: ['it_digital', 'ai_cloud'], confidence: 81, growth: 23 },
  { id: 'python', name: 'Python', category: 'stable', aliases: ['Python Programming', 'Python3'], parent: null, related: ['ai', 'ml', 'data_analytics'], industry_ids: ['it_digital', 'ai_cloud'], confidence: 88, growth: 10 },
];

// occupations
export const OCCUPATIONS = [
  { id: 'ev_assembler', name: 'EV Assembly Operator', industry_id: 'ev', skill_ids: ['ev_tech', 'industrial_automation'], automation_risk: 20 },
  { id: 'battery_eng', name: 'Battery Systems Engineer', industry_id: 'ev', skill_ids: ['ev_tech', 'embedded'], automation_risk: 10 },
  { id: 'ev_testing_tech', name: 'EV Testing Technician', industry_id: 'ev', skill_ids: ['ev_tech', 'industrial_automation', 'embedded'], automation_risk: 15 },
  { id: 'power_elec_eng', name: 'Power Electronics Engineer', industry_id: 'ev', skill_ids: ['embedded', 'ev_tech'], automation_risk: 12 },
  { id: 'charging_tech', name: 'Charging Infrastructure Technician', industry_id: 'ev', skill_ids: ['ev_tech', 'embedded'], automation_risk: 18 },
  { id: 'cnc_operator', name: 'CNC Machine Operator', industry_id: 'adv_manufacturing', skill_ids: ['industrial_automation', 'robotics'], automation_risk: 40 },
  { id: 'maintenance_eng', name: 'Industrial Maintenance Engineer', industry_id: 'adv_manufacturing', skill_ids: ['industrial_automation', 'robotics', 'embedded'], automation_risk: 25 },
  { id: 'qa_inspector', name: 'QA/QC Inspector', industry_id: 'adv_manufacturing', skill_ids: ['industrial_automation', 'data_analytics'], automation_risk: 50 },
  { id: 'semi_process_eng', name: 'Semiconductor Process Engineer', industry_id: 'semiconductor', skill_ids: ['semi_testing', 'embedded'], automation_risk: 15 },
  { id: 'vlsi_designer', name: 'VLSI Design Engineer', industry_id: 'semiconductor', skill_ids: ['semi_testing', 'embedded'], automation_risk: 10 },
  { id: 'semi_test_tech', name: 'Semiconductor Test Technician', industry_id: 'semiconductor', skill_ids: ['semi_testing'], automation_risk: 20 },
  { id: 'software_dev', name: 'Software Developer', industry_id: 'it_digital', skill_ids: ['python', 'cloud', 'devops'], automation_risk: 20 },
  { id: 'data_eng', name: 'Data Engineer', industry_id: 'it_digital', skill_ids: ['python', 'data_analytics', 'cloud'], automation_risk: 15 },
  { id: 'ml_engineer', name: 'ML Engineer', industry_id: 'ai_cloud', skill_ids: ['ml', 'python', 'cloud'], automation_risk: 8 },
  { id: 'cloud_architect', name: 'Cloud Architect', industry_id: 'ai_cloud', skill_ids: ['cloud', 'devops', 'cybersecurity'], automation_risk: 5 },
  { id: 'security_analyst', name: 'Security Analyst', industry_id: 'it_digital', skill_ids: ['cybersecurity', 'cloud'], automation_risk: 10 },
  { id: 'logistics_coord', name: 'Logistics Coordinator', industry_id: 'logistics', skill_ids: ['data_analytics', 'python'], automation_risk: 60 },
  { id: 'warehouse_tech', name: 'Warehouse Automation Technician', industry_id: 'logistics', skill_ids: ['robotics', 'industrial_automation'], automation_risk: 55 },
];

// training institutes
export const TRAINING_INSTITUTES = [
  { id: 'iti_nashik_1', name: 'Govt ITI Nashik Central', district_id: 'nashik', type: 'ITI', capacity: 500, utilization: 0.85, program_skills: ['industrial_automation', 'embedded'] },
  { id: 'iti_nashik_2', name: 'Govt ITI Nashik West', district_id: 'nashik', type: 'ITI', capacity: 400, utilization: 0.80, program_skills: ['industrial_automation'] },
  { id: 'poly_nashik_1', name: 'Govt Polytechnic Nashik', district_id: 'nashik', type: 'Polytechnic', capacity: 600, utilization: 0.90, program_skills: ['embedded', 'ev_tech', 'industrial_automation'] },
  { id: 'skill_nashik_1', name: 'Skill Development Center Nashik', district_id: 'nashik', type: 'Skill Center', capacity: 300, utilization: 0.70, program_skills: ['ev_tech', 'robotics'] },
  { id: 'iti_pune_1', name: 'Govt ITI Pune Hadapsar', district_id: 'pune', type: 'ITI', capacity: 600, utilization: 0.88, program_skills: ['python', 'cloud', 'devops'] },
  { id: 'poly_pune_1', name: 'Govt Polytechnic Pune', district_id: 'pune', type: 'Polytechnic', capacity: 800, utilization: 0.92, program_skills: ['python', 'data_analytics', 'ml', 'cloud'] },
  { id: 'skill_pune_1', name: 'IT Skill Center Pune', district_id: 'pune', type: 'Skill Center', capacity: 500, utilization: 0.75, program_skills: ['ai', 'ml', 'cloud', 'devops'] },
  { id: 'iti_nagpur_1', name: 'Govt ITI Nagpur', district_id: 'nagpur', type: 'ITI', capacity: 450, utilization: 0.82, program_skills: ['industrial_automation', 'logistics'] },
  { id: 'poly_nagpur_1', name: 'Govt Polytechnic Nagpur', district_id: 'nagpur', type: 'Polytechnic', capacity: 500, utilization: 0.85, program_skills: ['semi_testing', 'embedded'] },
  { id: 'iti_mumbai_1', name: 'Govt ITI Mumbai Central', district_id: 'mumbai', type: 'ITI', capacity: 700, utilization: 0.90, program_skills: ['python', 'cloud', 'cybersecurity'] },
  { id: 'skill_mumbai_1', name: 'Digital Skill Hub Mumbai', district_id: 'mumbai', type: 'Skill Center', capacity: 600, utilization: 0.78, program_skills: ['ai', 'ml', 'cloud', 'data_analytics'] },
  { id: 'iti_thane_1', name: 'Govt ITI Thane', district_id: 'thane', type: 'ITI', capacity: 500, utilization: 0.84, program_skills: ['python', 'devops', 'industrial_automation'] },
  { id: 'iti_kolhapur_1', name: 'Govt ITI Kolhapur', district_id: 'kolhapur', type: 'ITI', capacity: 350, utilization: 0.80, program_skills: ['industrial_automation', 'ev_tech'] },
  { id: 'iti_csambhajinagar_1', name: 'Govt ITI Chhatrapati Sambhajinagar', district_id: 'csambhajinagar', type: 'ITI', capacity: 400, utilization: 0.82, program_skills: ['industrial_automation', 'semi_testing'] },
];

// investments
export const INVESTMENTS = [
  {
    id: 'ev_nashik',
    name: 'New EV Manufacturing Plant',
    district_id: 'nashik',
    industry_id: 'ev',
    investment_size_cr: 5000,
    expected_jobs: 8000,
    status: 'announced',
    date: '2026-06',
    job_role_ids: ['ev_assembler', 'battery_eng', 'ev_testing_tech', 'power_elec_eng', 'charging_tech'],
    description: 'Major EV manufacturer establishing a ₹5,000 Cr production facility in Nashik. Expected to create 8,000 direct jobs across assembly, engineering, and testing roles.',
  },
  {
    id: 'semi_nagpur',
    name: 'Semiconductor Fabrication Unit',
    district_id: 'nagpur',
    industry_id: 'semiconductor',
    investment_size_cr: 8000,
    expected_jobs: 3500,
    status: 'planned',
    date: '2026-09',
    job_role_ids: ['semi_process_eng', 'vlsi_designer', 'semi_test_tech'],
    description: 'Semiconductor fabrication unit in Nagpur MIDC. ₹8,000 Cr investment targeting chip manufacturing and testing capabilities.',
  },
  {
    id: 'ev_kolhapur',
    name: 'EV Battery Manufacturing',
    district_id: 'kolhapur',
    industry_id: 'ev',
    investment_size_cr: 2500,
    expected_jobs: 4000,
    status: 'announced',
    date: '2026-07',
    job_role_ids: ['battery_eng', 'ev_assembler', 'ev_testing_tech'],
    description: 'EV battery manufacturing facility in Kolhapur. ₹2,500 Cr investment for lithium-ion battery pack assembly and testing.',
  },
  {
    id: 'ai_pune',
    name: 'AI Research & Cloud Hub',
    district_id: 'pune',
    industry_id: 'ai_cloud',
    investment_size_cr: 3000,
    expected_jobs: 5000,
    status: 'active',
    date: '2026-03',
    job_role_ids: ['ml_engineer', 'cloud_architect', 'data_eng'],
    description: 'AI/Cloud research and development hub in Pune Hinjewadi. ₹3,000 Cr investment in data centers and AI labs.',
  },
  {
    id: 'logistics_nagpur',
    name: 'Multi-Modal Logistics Hub',
    district_id: 'nagpur',
    industry_id: 'logistics',
    investment_size_cr: 1500,
    expected_jobs: 6000,
    status: 'active',
    date: '2026-01',
    job_role_ids: ['logistics_coord', 'warehouse_tech'],
    description: 'Multi-modal logistics hub leveraging Nagpur\'s central location. ₹1,500 Cr investment in automated warehousing.',
  },
  {
    id: 'mfg_csambhajinagar',
    name: 'Advanced Manufacturing Park',
    district_id: 'csambhajinagar',
    industry_id: 'adv_manufacturing',
    investment_size_cr: 2200,
    expected_jobs: 5000,
    status: 'announced',
    date: '2026-08',
    job_role_ids: ['cnc_operator', 'maintenance_eng', 'qa_inspector'],
    description: 'Advanced manufacturing park in Chhatrapati Sambhajinagar. ₹2,200 Cr investment in CNC, robotics, and smart manufacturing.',
  },
];

// economic events
export const ECONOMIC_EVENTS = [
  {
    id: 'evt_1',
    type: 'investment',
    district_id: 'nashik',
    industry_id: 'ev',
    title: 'EV Manufacturing Investment Detected',
    description: 'New ₹5,000 Cr EV manufacturing plant announced for Nashik. 8,000 jobs expected.',
    severity: 'positive',
    date: '2026-06-15',
  },
  {
    id: 'evt_2',
    type: 'risk',
    district_id: 'nashik',
    industry_id: 'adv_manufacturing',
    title: 'Manufacturing Automation Risk Increasing',
    description: 'Traditional manufacturing roles in Nashik facing 45% automation exposure over 24 months.',
    severity: 'high',
    date: '2026-06-10',
  },
  {
    id: 'evt_3',
    type: 'investment',
    district_id: 'nagpur',
    industry_id: 'semiconductor',
    title: 'Semiconductor Fab Unit Planned',
    description: '₹8,000 Cr semiconductor fabrication unit planned for Nagpur. 3,500 specialized jobs.',
    severity: 'positive',
    date: '2026-05-20',
  },
  {
    id: 'evt_4',
    type: 'risk',
    district_id: 'nagpur',
    industry_id: 'logistics',
    title: 'Logistics Automation Exposure',
    description: 'Warehouse and logistics roles in Nagpur showing 55% automation exposure.',
    severity: 'medium',
    date: '2026-05-15',
  },
  {
    id: 'evt_5',
    type: 'risk',
    district_id: 'pune',
    industry_id: 'it_digital',
    title: 'Legacy IT Skills Declining',
    description: 'Traditional IT roles requiring modernization. Cloud and AI skills gap widening.',
    severity: 'medium',
    date: '2026-06-01',
  },
];

// migration data
export const MIGRATION_DATA = [
  { district_id: 'nashik', trained: 12000, employed: 8600, retained: 5000, migrated: 3600 },
  { district_id: 'pune', trained: 25000, employed: 19500, retained: 12000, migrated: 7500 },
  { district_id: 'nagpur', trained: 8000, employed: 5700, retained: 3300, migrated: 2400 },
  { district_id: 'mumbai', trained: 30000, employed: 22000, retained: 14000, migrated: 8000 },
  { district_id: 'thane', trained: 15000, employed: 11000, retained: 6800, migrated: 4200 },
  { district_id: 'kolhapur', trained: 6000, employed: 4300, retained: 2600, migrated: 1700 },
  { district_id: 'csambhajinagar', trained: 5000, employed: 3500, retained: 2100, migrated: 1400 },
];

// skill demand by district, keyed "<district>__<skill>"
export const SKILL_DEMAND = {
  // Nashik
  'nashik__ev_tech': { demand: 88, supply: 34, growth: 22, confidence: 82, trend: 'rising' },
  'nashik__industrial_automation': { demand: 72, supply: 45, growth: 18, confidence: 78, trend: 'rising' },
  'nashik__embedded': { demand: 65, supply: 38, growth: 15, confidence: 80, trend: 'rising' },
  'nashik__robotics': { demand: 58, supply: 22, growth: 20, confidence: 75, trend: 'rising' },
  'nashik__python': { demand: 60, supply: 50, growth: 10, confidence: 85, trend: 'stable' },
  'nashik__data_analytics': { demand: 45, supply: 30, growth: 19, confidence: 80, trend: 'rising' },
  // Pune
  'pune__ai': { demand: 92, supply: 55, growth: 28, confidence: 85, trend: 'rising' },
  'pune__ml': { demand: 89, supply: 48, growth: 26, confidence: 83, trend: 'rising' },
  'pune__cloud': { demand: 85, supply: 52, growth: 24, confidence: 84, trend: 'rising' },
  'pune__python': { demand: 78, supply: 65, growth: 10, confidence: 88, trend: 'stable' },
  'pune__devops': { demand: 72, supply: 40, growth: 23, confidence: 81, trend: 'rising' },
  'pune__data_analytics': { demand: 70, supply: 48, growth: 19, confidence: 80, trend: 'rising' },
  'pune__cybersecurity': { demand: 68, supply: 35, growth: 21, confidence: 79, trend: 'rising' },
  // Nagpur
  'nagpur__semi_testing': { demand: 75, supply: 18, growth: 35, confidence: 70, trend: 'rising' },
  'nagpur__embedded': { demand: 60, supply: 28, growth: 15, confidence: 80, trend: 'rising' },
  'nagpur__data_analytics': { demand: 50, supply: 25, growth: 19, confidence: 80, trend: 'rising' },
  'nagpur__python': { demand: 55, supply: 40, growth: 10, confidence: 85, trend: 'stable' },
  'nagpur__industrial_automation': { demand: 58, supply: 30, growth: 18, confidence: 78, trend: 'rising' },
  // Mumbai
  'mumbai__cloud': { demand: 90, supply: 60, growth: 24, confidence: 84, trend: 'rising' },
  'mumbai__ai': { demand: 88, supply: 50, growth: 28, confidence: 85, trend: 'rising' },
  'mumbai__cybersecurity': { demand: 82, supply: 42, growth: 21, confidence: 79, trend: 'rising' },
  'mumbai__python': { demand: 80, supply: 68, growth: 10, confidence: 88, trend: 'stable' },
  'mumbai__data_analytics': { demand: 72, supply: 50, growth: 19, confidence: 80, trend: 'rising' },
  // Thane
  'thane__python': { demand: 70, supply: 55, growth: 10, confidence: 85, trend: 'stable' },
  'thane__devops': { demand: 65, supply: 38, growth: 23, confidence: 81, trend: 'rising' },
  'thane__industrial_automation': { demand: 60, supply: 35, growth: 18, confidence: 78, trend: 'rising' },
  'thane__cloud': { demand: 68, supply: 42, growth: 24, confidence: 84, trend: 'rising' },
  // Kolhapur
  'kolhapur__ev_tech': { demand: 72, supply: 20, growth: 22, confidence: 82, trend: 'rising' },
  'kolhapur__industrial_automation': { demand: 65, supply: 40, growth: 18, confidence: 78, trend: 'rising' },
  'kolhapur__embedded': { demand: 55, supply: 28, growth: 15, confidence: 80, trend: 'rising' },
  // Chhatrapati Sambhajinagar
  'csambhajinagar__semi_testing': { demand: 60, supply: 12, growth: 35, confidence: 70, trend: 'rising' },
  'csambhajinagar__industrial_automation': { demand: 68, supply: 35, growth: 18, confidence: 78, trend: 'rising' },
  'csambhajinagar__robotics': { demand: 50, supply: 18, growth: 20, confidence: 75, trend: 'rising' },
};

export function generateTimeSeries(skillId, districtId, months = 12) {
  const key = `${districtId}__${skillId}`;
  const base = SKILL_DEMAND[key] || { demand: 50, supply: 30, growth: 10 };
  const series = [];
  for (let i = months; i >= 0; i--) {
    const factor = 1 - (i * base.growth / 100 / months);
    series.push({
      month: i === 0 ? 'Now' : `T-${i}m`,
      demand: Math.round(base.demand * factor),
      supply: Math.round(base.supply * (1 - i * 0.01)),
      gap: Math.round(base.demand * factor - base.supply * (1 - i * 0.01)),
    });
  }
  return series;
}

// --- HELPER: Get all skills for a district ---
export function getDistrictSkills(districtId) {
  const result = [];
  for (const skill of SKILLS) {
    const key = `${districtId}__${skill.id}`;
    const demandData = SKILL_DEMAND[key];
    if (demandData) {
      result.push({ ...skill, ...demandData, gap: demandData.demand - demandData.supply });
    }
  }
  return result;
}

export function getDistrictInstitutes(districtId) {
  return TRAINING_INSTITUTES.filter(i => i.district_id === districtId);
}

// --- HELPER: Get investments for a district ---
export function getDistrictInvestments(districtId) {
  return INVESTMENTS.filter(i => i.district_id === districtId);
}

export function getIndustryOccupations(industryId) {
  return OCCUPATIONS.filter(o => o.industry_id === industryId);
}

export function getRequiredSkillsForOccupations(occupationIds) {
  const skillIds = new Set();
  const occupations = [];
  for (const occId of occupationIds) {
    const occ = OCCUPATIONS.find(o => o.id === occId);
    if (occ) {
      occupations.push(occ);
      occ.skill_ids.forEach(s => skillIds.add(s));
    }
  }
  const skills = Array.from(skillIds).map(sid => SKILLS.find(s => s.id === sid)).filter(Boolean);
  return { occupations, skills };
}

export function resolveSkillName(input) {
  const normalized = input.toLowerCase().trim();
  for (const skill of SKILLS) {
    if (skill.name.toLowerCase() === normalized) return skill;
    if (skill.aliases.some(a => a.toLowerCase() === normalized)) return skill;
  }
  return null;
}

export const DATA_SOURCES = {
  labourMarket: {
    id: 'labourMarket',
    label: 'Labour Market',
    connected: false,
    detail: 'No live labour-market feed connected (NCS / EPFO / employment exchange).',
  },
  governmentData: {
    id: 'governmentData',
    label: 'Government District Data',
    connected: false,
    detail: 'No live government open-data source connected.',
  },
  investments: {
    id: 'investments',
    label: 'Investment & Economic Feed',
    connected: false,
    detail: 'No live investment / MIDC feed connected.',
  },
  documentAI: {
    id: 'documentAI',
    label: 'Document AI / OCR',
    connected: false,
    detail: 'Document processing service not connected.',
  },
  googleSheets: {
    id: 'googleSheets',
    label: 'Google Sheets',
    connected: true,
  },
  googleDrive: {
    id: 'googleDrive',
    label: 'Google Drive',
    connected: true,
  },
  googleDocs: {
    id: 'googleDocs',
    label: 'Google Docs',
    connected: true,
  },
};

export const REFERENCE_DATASET = {
  label: 'Reference Dataset',
  note: 'Seeded reference dataset drives deterministic simulation. Connect a live source for production use.',
};

export function getDataSourceStatus(id) {
  return DATA_SOURCES[id] || null;
}

export function isSourceConnected(id) {
  return Boolean(DATA_SOURCES[id]?.connected);
}

export const ANY_LIVE_SOURCE_CONNECTED = Object.values(DATA_SOURCES).some((s) => s.connected);

export const ENTITY_SCHEMAS = {
  User: {
    name: 'User',
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: 'The role of the user in the app — government workforce intelligence roles',
        enum: ['admin', 'user', 'state_official', 'district_official', 'analyst'],
      },
    },
    required: ['role'],
  },
  SimulationRun: {
    name: 'SimulationRun',
    type: 'object',
    properties: {
      district_id: { type: 'string', description: 'District identifier' },
      district_name: { type: 'string', description: 'District display name' },
      industry_id: { type: 'string', description: 'Industry identifier' },
      industry_name: { type: 'string', description: 'Industry display name' },
      investment_id: { type: 'string', description: 'Investment scenario identifier' },
      investment_name: { type: 'string', description: 'Investment scenario name' },
      budget_cr: { type: 'number', description: 'Budget in Crore INR' },
      training_target: { type: 'number', description: 'Target number of people to train' },
      time_horizon_months: { type: 'number', description: 'Time horizon in months' },
      priority: {
        type: 'string',
        enum: ['skill_gap_reduction', 'employment_impact', 'local_retention', 'speed'],
        description: 'Optimization priority objective',
      },
      scenario_type: {
        type: 'string',
        enum: ['upgrade_existing', 'build_new', 'mixed'],
        description: 'Scenario strategy type',
      },
      result: {
        type: 'object',
        description:
          'Full simulation result JSON: affected_jobs, required_skills, skill_gaps, training_seats, institute_upgrades, trainer_requirement, infrastructure, estimated_cost, workforce_coverage, skill_gap_reduction, employment_impact, local_retention, allocation',
      },
      status: { type: 'string', enum: ['completed', 'failed'], default: 'completed' },
    },
    required: ['district_id', 'industry_id', 'budget_cr', 'training_target', 'time_horizon_months', 'priority'],
  },
  OptimizationRun: {
    name: 'OptimizationRun',
    type: 'object',
    properties: {
      budget_cr: { type: 'number', description: 'Total budget in Crore INR' },
      district_id: { type: 'string', description: 'Target district identifier' },
      district_name: { type: 'string', description: 'District display name' },
      allocation: {
        type: 'array',
        items: { type: 'object' },
        description:
          'Budget allocation breakdown: [{ category, label, amount_cr, seats, skill_gap_reduction, employment_impact }]',
      },
      total_seats: { type: 'number', description: 'Total training seats allocated' },
      total_institute_upgrades: { type: 'number', description: 'Total institutes upgraded' },
      total_trainers: { type: 'number', description: 'Total trainers required' },
      skill_gap_reduction_pct: { type: 'number', description: 'Projected skill-gap reduction percentage' },
      workforce_coverage_pct: { type: 'number', description: 'Projected workforce coverage percentage' },
      employment_impact: { type: 'number', description: 'Potential employment impact (number of people)' },
      local_retention_pct: { type: 'number', description: 'Local talent retention percentage' },
      total_allocated_cr: { type: 'number', description: 'Total budget actually allocated' },
      is_feasible: { type: 'boolean', description: 'Whether allocation is feasible within constraints' },
      priority: {
        type: 'string',
        enum: ['skill_gap_reduction', 'employment_impact', 'local_retention', 'speed'],
        description: 'Optimization priority objective',
      },
    },
    required: ['budget_cr', 'district_id', 'allocation', 'total_allocated_cr'],
  },
  CurriculumAnalysis: {
    name: 'CurriculumAnalysis',
    type: 'object',
    properties: {
      filename: { type: 'string', description: 'Uploaded document filename' },
      file_url: { type: 'string', description: 'URL of uploaded file' },
      program_name: { type: 'string', description: 'Detected or entered program name' },
      extracted_subjects: { type: 'array', items: { type: 'string' }, description: 'Subjects extracted from curriculum' },
      extracted_skills: { type: 'array', items: { type: 'string' }, description: 'Skills identified in curriculum' },
      detected_technologies: { type: 'array', items: { type: 'string' }, description: 'Technologies mentioned in curriculum' },
      alignment_score: { type: 'number', description: 'Industry alignment score (0-100)' },
      missing_skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Skills required by industry but missing from curriculum',
      },
      outdated_skills: { type: 'array', items: { type: 'string' }, description: 'Skills in curriculum that are outdated' },
      emerging_skills: { type: 'array', items: { type: 'string' }, description: 'Emerging skills that should be added' },
      recommendations: { type: 'array', items: { type: 'string' }, description: 'Recommended curriculum updates' },
      industry_target: { type: 'string', description: 'Target industry for alignment comparison' },
      analysis_method: {
        type: 'string',
        enum: ['mock', 'llm', 'custom_nlp'],
        description: 'Method used for analysis',
      },
    },
    required: ['filename', 'file_url', 'alignment_score', 'analysis_method'],
  },
};
