// ============================================================
// FORESKILLS — PROVIDER INTERFACES + SERVICE LAYER
// Each provider exposes a predictable async interface. The UI never
// talks to an external service directly. Reference implementations
// run fully locally; real integrations replace them here without
// touching pages or engines.
//
// Result convention for unconfigured external sources:
//   { status: 'not_configured', message: '...', data: null }
//
// The ApiService mapping at the bottom (previously src/lib/services)
// bridges providers with UI pages and application workflows.
// ============================================================

import { SKILL_DEMAND, DISTRICTS, INVESTMENTS, ECONOMIC_EVENTS, MIGRATION_DATA } from '@/data/data';
import {
  calculateDistrictSkillGaps,
  calculateRisk,
  getAllRisks,
  extractSkillsFromText as localExtractSkillsFromText,
  runOptimization,
} from '@/engines/engines';

export const NOT_CONFIGURED = 'not_configured';

/** @param {string} message */
function notConfigured(message) {
  return { status: NOT_CONFIGURED, data: null, message };
}

// [TEAM INTEGRATION 01] Real labour-market data
export const labourMarketProvider = {
  sourceId: 'labourMarket',
  isConfigured: false,
  /**
   * @param {string} skillId
   * @param {string} districtId
   */
  async getJobDemand(skillId, districtId) {
    // TODO: Replace with a real labour market API.
    // Options: National Career Service (NCS), EPFO payroll data,
    // Maharashtra Employment Exchange feeds.
    if (!this.isConfigured && import.meta.env.PROD) {
      return notConfigured('Labour market data source is not connected.');
    }
    return {
      status: 'reference_dataset',
      data: SKILL_DEMAND[`${districtId}__${skillId}`] || { demand: 50, supply: 30, growth: 10, confidence: 75 },
    };
  },
  /** @param {string} districtId */
  async getDistrictSkillDemand(districtId) {
    return { status: 'reference_dataset', data: calculateDistrictSkillGaps(districtId) };
  },
};

// [TEAM INTEGRATION 02] Government datasets
// Final demo mode: fully local. The reference dataset in
// src/data/data.js drives every response — no external service.
export const governmentDataProvider = {
  sourceId: 'governmentData',
  isConfigured: false,

  async getDistricts() {
    return { status: 'reference_dataset', data: DISTRICTS };
  },

  /** @param {string} districtId */
  async getDistrictData(districtId) {
    const district = DISTRICTS.find((d) => d.id === districtId);
    if (!district) return notConfigured(`No district record found for "${districtId}".`);
    return { status: 'reference_dataset', data: district };
  },

  /**
   * Live national economic indicators — no live feed is connected
   * in demo mode; reported honestly.
   */
  async getLiveIndicators() {
    return notConfigured('No live indicator feed connected — demo runs on the reference dataset.');
  },

  /** @param {string} _districtId */
  async getDistrictWeather(_districtId) {
    return notConfigured('No live weather feed connected — demo runs on the reference dataset.');
  },
};

// [TEAM INTEGRATION 03] Real investment/economic event feeds
export const investmentDataProvider = {
  sourceId: 'investments',
  isConfigured: false,
  /** @param {string} [districtId] */
  async getInvestments(districtId) {
    // TODO: Replace with MIDC / RBI / MCA investment feeds.
    const data = districtId ? INVESTMENTS.filter((i) => i.district_id === districtId) : INVESTMENTS;
    return { status: 'reference_dataset', data };
  },
  /** @param {string} [districtId] */
  async getEconomicEvents(districtId) {
    const data = districtId ? ECONOMIC_EVENTS.filter((e) => e.district_id === districtId) : ECONOMIC_EVENTS;
    return { status: 'reference_dataset', data };
  },
};

// [TEAM INTEGRATION 04] Custom forecasting model
export const forecastProvider = {
  sourceId: 'labourMarket',
  isConfigured: false,
  /**
   * @param {string} districtId
   * @param {string} skillId
   * @param {number} [horizonMonths]
   */
  async getForecast(districtId, skillId, horizonMonths = 12) {
    // TODO: Replace with a real forecasting model (ARIMA/Prophet/LSTM).
    // Current: deterministic linear projection from the reference growth rate.
    const entry = SKILL_DEMAND[`${districtId}__${skillId}`];
    if (!entry) {
      return notConfigured('Forecast unavailable — no reference data for this district and skill.');
    }
    return {
      status: 'reference_dataset',
      data: {
        current_demand: entry.demand,
        projected_demand: Math.round(entry.demand * (1 + (entry.growth / 100) * (horizonMonths / 12))),
        horizon_months: horizonMonths,
        method: 'Linear projection from reference growth rate',
      },
    };
  },
};

// [TEAM INTEGRATION 05] Skill extraction (documents → canonical skills)
export const skillExtractionProvider = {
  sourceId: 'documentAI',
  isConfigured: false,
  /**
   * Extract canonical skills from plain text using the local
   * keyword/ontology matcher. Deterministic — no external service.
   */
  /**
   * @param {string} text
   * @param {string | null} [targetIndustryId]
   * @returns {Promise<{ status: 'local', data: string[] } | { status: 'not_configured', data: null, message: string }>}
   */
  async extractSkillsFromText(text, targetIndustryId) {
    return { status: 'local', data: localExtractSkillsFromText(text, targetIndustryId) };
  },
  /**
   * Extract skills from an uploaded file. Only UTF-8 text formats are
   * supported locally (.txt/.md/.csv). PDF/DOCX require a Document AI
   * integration — reported honestly as not_configured, never faked.
   */
  /**
   * @param {File} [file]
   * @param {string | null} [targetIndustryId]
   */
  async extractFromFile(file, targetIndustryId) {
    const TEXT_EXTENSIONS = ['.txt', '.md', '.csv'];
    const name = file?.name || '';
    const extension = name.slice(name.lastIndexOf('.')).toLowerCase();

    if (!TEXT_EXTENSIONS.includes(extension)) {
      return notConfigured(
        `PDF/DOCX parsing requires a Document AI integration. Supported locally: ${TEXT_EXTENSIONS.join(', ')}.`
      );
    }
    try {
      const text = await /** @type {File} */ (file).text();
      return this.extractSkillsFromText(text, targetIndustryId);
    } catch {
      return notConfigured('The selected file could not be read as text.');
    }
  },
};

// [TEAM INTEGRATION 06] OCR / Document AI (full document pipeline)
export const documentAIProvider = {
  sourceId: 'documentAI',
  isConfigured: false,
  /**
   * TODO: integrate Google Document AI / Azure Form Recognizer /
   * AWS Textract for PDF & DOCX text extraction.
   * Integration point: implement configure(credentials) + extractText(file).
   */
  configure() {},
  async extractText() {
    return notConfigured(
      'Document AI service is not configured. Upload a .txt/.md file or connect a Document AI provider in src/providers/providers.js.'
    );
  },
};

// [TEAM INTEGRATION 07] Advanced optimization (OR-Tools / custom)
export const optimizationProvider = {
  /** @param {import('@/engines/engines').OptimizationInput} input */
  async optimize(input) {
    // TODO: Replace with OR-Tools / custom solver when available.
    // Current: deterministic greedy allocation engine.
    return { status: 'local', data: runOptimization(input) };
  },
};

// [TEAM INTEGRATION 08] Report generation & export
export const reportProvider = {
  sourceId: 'documentAI',
  googleDocsConfigured: false,
  googleSlidesConfigured: false,
  /**
   * @typedef {Object} PolicyReport
   * @property {string | undefined} type
   * @property {Record<string, unknown>} inputs
   * @property {string | undefined} method
   * @property {unknown} results
   * @property {number | string} [confidence]
   * @property {string[]} evidence
   * @property {string} timestamp
   * @property {string} [data_source]
   */

  /**
   * Build a structured policy briefing from computed simulation data.
   * Deterministic template over engine output — no fabricated numbers.
   *
   * @param {{ title?: string, inputs?: Record<string, unknown>, method?: string, results?: unknown, confidence?: number, evidence?: string[] }} options
   * @returns {PolicyReport}
   */
  generate({ title, inputs = {}, method, results, confidence, evidence = [] }) {
    const timestamp = new Date().toISOString();
    return {
      type: title,
      inputs,
      method,
      results,
      confidence,
      evidence,
      timestamp,
      data_source: 'Reference dataset',
    };
  },
  /** @param {PolicyReport} report */
  formatAsText(report) {
    const line = '='.repeat(60);
    return [
      `FORESKILLS — ${report.type}`,
      line,
      `Generated: ${report.timestamp}`,
      `Data Source: ${report.data_source}`,
      '',
      'INPUTS:',
      ...Object.entries(report.inputs).map(([k, v]) => `  ${k}: ${v}`),
      '',
      'METHOD:',
      `  ${report.method}`,
      '',
      'RESULTS:',
      JSON.stringify(report.results, null, 2),
      '',
      `CONFIDENCE: ${report.confidence}%`,
      '',
      'EVIDENCE:',
      ...report.evidence.map((e) => `  • ${e}`),
      '',
      line,
      'FORESKILLS — Workforce Intelligence & Policy Simulation',
    ].join('\n');
  },
  /** @param {PolicyReport} _report */
  async exportToGoogleDocs(_report) {
    // TODO: Requires the Google Docs connector with OAuth credentials.
    return notConfigured('Integration not configured — Google Docs export needs OAuth credentials.');
  },
  /** @param {PolicyReport} _report */
  async exportToGoogleSlides(_report) {
    // TODO: Requires the Google Slides connector with OAuth credentials.
    return notConfigured('Integration not configured — Google Slides export needs OAuth credentials.');
  },
};

// [TEAM INTEGRATION 09] Explanation layer (text only — never numbers)
export const explanationProvider = {
  /** @param {ReturnType<typeof import('@/engines/engines').runSimulation>} result */
  async explain(result) {
    // TODO: Optional LLM narration. The LLM may ONLY explain results that
    // the deterministic engines produced — never calculate figures itself.
    const occupations = result.affected_occupations?.length || 0;
    const skills = result.required_skills?.length || 0;
    const allocated = result.optimization?.total_allocated_cr || 0;
    const categories = result.allocation?.length || 0;
    return (
      `This simulation analyzed ${occupations} job roles and ${skills} required skills. ` +
      `The optimization allocated ₹${allocated}Cr across ${categories} categories, achieving ` +
      `${result.skill_gap_reduction_pct || 0}% skill-gap reduction and an estimated employment ` +
      `impact of ${result.employment_impact || 0} people.`
    );
  },
};

// [TEAM INTEGRATION 10] Talent mobility model
export const talentMobilityProvider = {
  sourceId: 'governmentData',
  isConfigured: false,
  /** @param {string} districtId */
  async getMobilityData(districtId) {
    // TODO: Replace with census migration / EPFO location-change data.
    return { status: 'reference_dataset', data: MIGRATION_DATA.find((m) => m.district_id === districtId) || null };
  },
  async getAllMobilityData() {
    return { status: 'reference_dataset', data: MIGRATION_DATA };
  },
};

// Risk analytics (thin wrappers so pages never import engines directly
// when they prefer the provider surface).
export const riskAnalyticsProvider = {
  /**
   * @param {string} districtId
   * @param {string} industryId
   */
  async getRisk(districtId, industryId) {
    return { status: 'reference_dataset', data: calculateRisk(districtId, industryId) };
  },
  async getAllRisks() {
    return { status: 'reference_dataset', data: getAllRisks() };
  },
};

// ============================================================
// SERVICE LAYER (previously src/lib/services/index.js)
// Bridges providers with UI pages and application workflows.
// ============================================================

export const ApiService = {
  labourMarket: labourMarketProvider,
  governmentData: governmentDataProvider,
  investmentData: investmentDataProvider,
  forecast: forecastProvider,
  skillExtraction: skillExtractionProvider,
  documentAI: documentAIProvider,
  optimization: optimizationProvider,
  report: reportProvider,
  explanation: explanationProvider,
  talentMobility: talentMobilityProvider,
  riskAnalytics: riskAnalyticsProvider,
};

export default ApiService;
