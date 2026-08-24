import React, { useState, useRef } from 'react';
import { FileText, Upload, Play, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import { INDUSTRIES, SKILLS, getIndustryOccupations } from '@/data/data';
import { analyzeCurriculum, MOCK_CURRICULUM_TEXT } from '@/engines/engines';
import { skillExtractionProvider } from '@/providers/providers';
import { SectionCard, DataSourceBadge, EvidencePanel } from '@/components/Common';
import { useChartTheme } from '@/components/Charts';

/**
 * @typedef {Object} CurriculumResult
 * @property {string[]} extracted_skills
 * @property {string[]} detected_technologies
 * @property {string[]} [extracted_subjects]
 * @property {number} alignment_score
 * @property {string[]} matched_skills
 * @property {string[]} missing_skills
 * @property {string[]} outdated_skills
 * @property {string[]} emerging_skills
 * @property {string[]} recommendations
 * @property {string} [industry_target]
 * @property {string} [program_name]
 * @property {string} [filename]
 * @property {string} [analysis_method]
 * @property {string} [method]
 * @property {number} confidence
 */

export default function CurriculumIntelligence() {
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [targetIndustry, setTargetIndustry] = useState('ev');
  const [programName, setProgramName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(/** @type {CurriculumResult | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [useMock, setUseMock] = useState(false);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const { colors: cc } = useChartTheme();

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  const handleFileSelect = (e) => {
    const selected = /** @type {FileList} */ (e.target.files)[0];
    if (selected) {
      // Validate file type
      const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
      const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(ext)) {
        setError(`Invalid file type. Accepted: ${validTypes.join(', ')}`);
        return;
      }
      // Validate file size (10MB limit)
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      if (useMock || !file) {
        // Sample document path: analyze the built-in sample curriculum text
        await new Promise(r => setTimeout(r, 800));
        const sampleResult = /** @type {CurriculumResult} */ (analyzeCurriculum(MOCK_CURRICULUM_TEXT, targetIndustry));
        sampleResult.program_name = programName || 'Sample Diploma in Computer Engineering';
        sampleResult.filename = 'sample_curriculum.txt';
        sampleResult.analysis_method = 'local';
        setResult(sampleResult);
      } else {
        // Local extraction path: text files are read and analyzed locally;
        // PDF/DOCX honestly report that Document AI is not configured.
        const extraction = await skillExtractionProvider.extractFromFile(file, targetIndustry);
        if (extraction.status === 'not_configured') {
          setError(extraction.message);
          return;
        }

        const extractedSkillNames = /** @type {{ extracted_skills?: string[] }} */ (extraction.data).extracted_skills || [];

        // Compare extracted skills with industry requirements
        const industry = INDUSTRIES.find(i => i.id === targetIndustry);
        const industryOccupations = getIndustryOccupations(targetIndustry);
        const requiredSkillIds = new Set(industryOccupations.flatMap(o => o.skill_ids));
        const requiredSkills = Array.from(requiredSkillIds).flatMap(sid => {
          const skill = SKILLS.find(s => s.id === sid);
          return skill ? [skill] : [];
        });

        // Match extracted skills against ontology
        /** @type {typeof SKILLS} */
        const matchedSkills = [];
        for (const reqSkill of requiredSkills) {
          const allNames = [reqSkill.name.toLowerCase(), ...reqSkill.aliases.map(a => a.toLowerCase())];
          if (extractedSkillNames.some(es => allNames.includes(es.toLowerCase()))) {
            matchedSkills.push(reqSkill);
          }
        }

        const alignmentScore = requiredSkills.length > 0
          ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
          : 50;

        const missingSkills = requiredSkills.filter(s => !matchedSkills.find(m => m.id === s.id)).map(s => s.name);
        const matchedNames = matchedSkills.map(s => s.name);
        const outdatedSkills = extractedSkillNames.filter(es => {
          const skill = SKILLS.find(s => s.name.toLowerCase() === es.toLowerCase() || s.aliases.some(a => a.toLowerCase() === es.toLowerCase()));
          return skill && !requiredSkillIds.has(skill.id);
        });
        const emergingSkills = requiredSkills.filter(s => s.category === 'emerging' || s.category === 'fast_growing').map(s => s.name);

        const recommendations = [
          ...missingSkills.map(s => `Add ${s} module to curriculum`),
          ...emergingSkills.map(s => `Introduce ${s} as emerging technology module`),
          `Target alignment with ${industry?.name} skill requirements`,
          'Update practical labs to match current industry tools',
        ];

        setResult({
          extracted_skills: extractedSkillNames,
          detected_technologies: [],
          extracted_subjects: [],
          alignment_score: alignmentScore,
          matched_skills: matchedNames,
          missing_skills: missingSkills,
          outdated_skills: outdatedSkills,
          emerging_skills: emergingSkills,
          recommendations,
          industry_target: industry?.name,
          program_name: programName || file.name,
          filename: file.name,
          analysis_method: 'local',
          method: 'Local keyword extraction (skill ontology) + deterministic alignment analysis',
          confidence: 70,
        });
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Try the sample document.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Curriculum Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Upload curriculum documents and analyze alignment with industry demand</p>
        </div>
        <DataSourceBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Panel */}
        <SectionCard title="Document Upload" icon={Upload}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Program Name (optional)</label>
              <input
                type="text"
                value={programName}
                onChange={e => setProgramName(e.target.value)}
                placeholder="e.g., Diploma in Computer Engineering"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Industry</label>
              <select
                value={targetIndustry}
                onChange={e => setTargetIndustry(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              >
                {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            {/* File Upload */}
            {!useMock && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="w-5 h-5 text-[hsl(var(--status-low))]" />
                    <span className="text-sm text-foreground">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Click to upload PDF/DOCX</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Max 10MB</p>
                  </>
                )}
              </div>
            )}

            {/* Mock toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useMock}
                onChange={e => setUseMock(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-xs text-muted-foreground">Use demo curriculum (no upload needed)</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--status-high))]/10 border border-[hsl(var(--status-high))]/20">
                <AlertCircle className="w-4 h-4 text-[hsl(var(--status-high))]" />
                <span className="text-xs text-[hsl(var(--status-high))]">{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing || (!file && !useMock)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {analyzing ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Play className="w-4 h-4" /> Analyze Curriculum</>
              )}
            </button>

            {/* Integration Points */}
            <div className="p-3 rounded-lg bg-secondary/20 border border-dashed border-border">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-medium mb-1">[TEAM INTEGRATION 06]</p>
              <p className="text-[10px] text-muted-foreground/70">
                Document analysis uses mock extraction. Replace with OCR / Document AI / custom NLP via documentAIProvider.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {!result && !analyzing && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Upload a curriculum document or use demo mode, then click "Analyze"</p>
            </div>
          )}

          {analyzing && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing curriculum...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{useMock ? 'Mock skill extraction' : 'Document AI extraction'}</p>
            </div>
          )}

          {result && !analyzing && (
            <>
              {/* Alignment Score */}
              <SectionCard title="Alignment Analysis" subtitle={`${result.program_name} vs ${result.industry_target}`} icon={CheckCircle} demo>
                <div className="flex items-center gap-6 mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={result.alignment_score >= 70 ? cc.supply : result.alignment_score >= 50 ? cc.series[2] : cc.gap}
                        strokeWidth="8"
                        strokeDasharray={`${result.alignment_score * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{result.alignment_score}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Industry Alignment Score</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.alignment_score >= 70 ? 'Well-aligned with industry demand' :
                       result.alignment_score >= 50 ? 'Moderate alignment — updates needed' :
                       'Poor alignment — significant gaps'}
                    </p>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Extracted Skills ({result.extracted_skills.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.extracted_skills.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-[hsl(var(--status-low))]/10 text-[hsl(var(--status-low))] border border-[hsl(var(--status-low))]/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {result.detected_technologies?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Detected Technologies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.detected_technologies.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-muted-foreground border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Gap Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-[hsl(var(--status-high))]/10 border border-[hsl(var(--status-high))]/20">
                  <h4 className="text-xs text-[hsl(var(--status-high))] font-medium uppercase mb-2">Missing Skills</h4>
                  <div className="space-y-1">
                    {result.missing_skills.length > 0 ? result.missing_skills.map((s, i) => (
                      <p key={i} className="text-xs text-foreground">• {s}</p>
                    )) : <p className="text-xs text-muted-foreground">None</p>}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[hsl(var(--status-medium))]/10 border border-[hsl(var(--status-medium))]/20">
                  <h4 className="text-xs text-[hsl(var(--status-medium))] font-medium uppercase mb-2">Outdated Skills</h4>
                  <div className="space-y-1">
                    {result.outdated_skills.length > 0 ? result.outdated_skills.map((s, i) => (
                      <p key={i} className="text-xs text-foreground">• {s}</p>
                    )) : <p className="text-xs text-muted-foreground">None</p>}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[hsl(var(--status-info))]/10 border border-[hsl(var(--status-info))]/20">
                  <h4 className="text-xs text-[hsl(var(--status-info))] font-medium uppercase mb-2">Emerging Skills</h4>
                  <div className="space-y-1">
                    {result.emerging_skills.length > 0 ? result.emerging_skills.map((s, i) => (
                      <p key={i} className="text-xs text-foreground">• {s}</p>
                    )) : <p className="text-xs text-muted-foreground">None</p>}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <SectionCard title="Recommended Curriculum Updates" icon={FileText} demo>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <EvidencePanel
                confidence={result.confidence || 70}
                evidence={[
                  `Extracted ${result.extracted_skills.length} skills from curriculum`,
                  `Compared against ${result.industry_target} industry requirements`,
                  `Alignment: ${result.alignment_score}%`,
                  `${result.missing_skills.length} missing, ${result.outdated_skills.length} outdated`,
                ]}
                method={result.method || 'Mock skill extraction (keyword matching against skill ontology)'}
                timestamp="DEMO DATA — Mock analysis"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}