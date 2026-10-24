import React, { useState, useMemo } from 'react';
import {
  Module3InteractionDiscoveryResult,
  Stage3HierarchicalPatternResult,
  EvidenceDrivenHdplResult,
  HdplPrimaryDiseasePattern,
} from '../types';
import {
  runHierarchicalPatternLearning,
  generateDiseasePatternsCSV,
  generatePatternFeaturesCSV,
  generatePatternInteractionsCSV,
} from '../utils/patternLearningEngine';
import {
  runEvidenceDrivenHdpl,
  generateHdplPrimaryPatternsCSV,
  generateHdplSubPatternsCSV,
} from '../utils/evidenceDrivenHdplEngine';
import {
  GitFork,
  Layers,
  Dna,
  Database,
  Info,
  Download,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface Stage3HierarchicalPatternLearningProps {
  discoveryResult: Module3InteractionDiscoveryResult;
  onNavigateSubView?: (viewId: string) => void;
  onNavigateToStage?: (stage: string) => void;
}

export const Stage3HierarchicalPatternLearning: React.FC<Stage3HierarchicalPatternLearningProps> = ({
  discoveryResult,
  onNavigateToStage,
}) => {
  // 1. Immutable Engine Computations
  const patternResult: Stage3HierarchicalPatternResult = useMemo(() => {
    return runHierarchicalPatternLearning(discoveryResult);
  }, [discoveryResult]);

  const hdplResult: EvidenceDrivenHdplResult = useMemo(() => {
    return runEvidenceDrivenHdpl(discoveryResult, patternResult);
  }, [discoveryResult, patternResult]);

  // 2. Active Disease Selection (Exactly 3 diseases, exactly 1 primary pattern each)
  const [selectedDisease, setSelectedDisease] = useState<'Diabetes' | 'Heart Disease' | 'CKD'>('Heart Disease');

  // Active Primary Pattern
  const activePattern: HdplPrimaryDiseasePattern = useMemo(() => {
    return hdplResult.primaryPatterns[selectedDisease];
  }, [hdplResult, selectedDisease]);

  // Validated Feature Count (Strictly 19)
  const validatedFeatureCount = 19;

  // Primary features meeting core threshold FI_norm >= 0.60
  const primaryFeatures = useMemo(() => {
    if (!activePattern?.allRankedFeatures) return [];
    return activePattern.allRankedFeatures.filter((f) => f.normalizedHierarchicalContribution >= 0.60);
  }, [activePattern]);

  // Key supporting non-redundant interactions
  const supportingInteractions = useMemo(() => {
    return activePattern?.keyInteractions || [];
  }, [activePattern]);

  // Feature Coverage dynamically computed against validated 19 features
  const coverageRatio = useMemo(() => {
    return primaryFeatures.length / validatedFeatureCount;
  }, [primaryFeatures.length, validatedFeatureCount]);

  // CSV Exporter Handler
  const handleDownloadCSV = (type: 'primary' | 'sub' | 'features' | 'interactions') => {
    let csvContent = '';
    let fileName = '';
    const dateStr = new Date().toISOString().slice(0, 10);

    if (type === 'primary') {
      csvContent = generateHdplPrimaryPatternsCSV(hdplResult.primaryPatternList);
      fileName = `hdpl_primary_disease_patterns_${dateStr}.csv`;
    } else if (type === 'sub') {
      csvContent = generateHdplSubPatternsCSV(hdplResult.allSubPatterns);
      fileName = `hdpl_supporting_sub_patterns_${dateStr}.csv`;
    } else if (type === 'features') {
      csvContent = generatePatternFeaturesCSV(patternResult.featureRows);
      fileName = `hdpl_feature_evidence_${dateStr}.csv`;
    } else if (type === 'interactions') {
      csvContent = generatePatternInteractionsCSV(patternResult.interactionRows);
      fileName = `hdpl_interaction_evidence_${dateStr}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pattern Descriptors & Primary Statistical Pattern Explanations (No biological causation claims)
  const patternDescriptors: Record<
    'Diabetes' | 'Heart Disease' | 'CKD',
    { id: string; descriptor: string; statisticalExplanation: string }
  > = {
    Diabetes: {
      id: 'DM-PAT-01',
      descriptor: 'Data-Derived Glycemic & Metabolic Pattern',
      statisticalExplanation:
        'Glycemic & Metabolic Pattern is the primary statistical pattern for Diabetes based on cohort evidence (reflecting predictive feature attribution and interaction scores; it does not imply biological causation).',
    },
    'Heart Disease': {
      id: 'HD-PAT-01',
      descriptor: 'Data-Derived Cardiometabolic Pattern',
      statisticalExplanation:
        'Cardiometabolic Pattern is the primary statistical pattern for Heart Disease based on cohort evidence.',
    },
    CKD: {
      id: 'CKD-PAT-01',
      descriptor: 'Data-Derived Renal Clearance Pattern',
      statisticalExplanation:
        'Renal Clearance Pattern is the primary statistical pattern for CKD based on cohort evidence.',
    },
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* ========================================================================= */}
      {/* 1. MODULE 3 TOP NAVIGATION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-medium text-slate-500">
            <span className="font-bold text-slate-700">Module 3 Workflow:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            <button
              onClick={() => onNavigateToStage?.('3.1')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <GitFork className="w-3.5 h-3.5 text-slate-400" />
              <span>3.1 Adaptive Discovery</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
              aria-current="page"
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>3.2 Hierarchical Patterns</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/25 text-white uppercase tracking-wider font-mono">
                Active
              </span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              onClick={() => onNavigateToStage?.('3.3')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Dna className="w-3.5 h-3.5 text-slate-400" />
              <span>3.3 Disease Signatures</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              onClick={() => onNavigateToStage?.('3.4')}
              title="Downstream Patient Risk Inference Engine"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>3.4 KA-UDPM Hybrid Fusion</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STAGE HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                Stage 3.2 Audit
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Read-Only Academic Stage
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5">
              Hierarchical Disease Pattern Learning
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-0.5">
              Data-derived hierarchical learning of disease-associated feature patterns.
            </p>
          </div>

          {/* Compact CSV Exports Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px] mr-1 flex items-center space-x-1">
              <Download className="w-3.5 h-3.5" />
              <span>Exports:</span>
            </span>
            <button
              onClick={() => handleDownloadCSV('primary')}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium font-mono cursor-pointer transition-colors"
            >
              hdpl_primary.csv
            </button>
            <button
              onClick={() => handleDownloadCSV('features')}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium font-mono cursor-pointer transition-colors"
            >
              features.csv
            </button>
            <button
              onClick={() => handleDownloadCSV('interactions')}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium font-mono cursor-pointer transition-colors"
            >
              interactions.csv
            </button>
          </div>
        </div>

        {/* Compact Status Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Validated Features</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{validatedFeatureCount}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Diseases</span>
            <span className="font-bold text-slate-900 font-mono text-sm">3</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Primary Patterns</span>
            <span className="font-bold text-slate-900 font-mono text-sm">3</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Mode</span>
            <span className="font-bold text-slate-900 font-mono text-sm">Read Only</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Status</span>
            <span className="font-bold text-emerald-700 font-mono text-sm flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>Ready</span>
            </span>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 4. MATHEMATICAL DISTINCTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Mathematical Formulation & Domain Annotation Architecture
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">1. Feature Attribution (FI)</div>
            <div className="text-slate-400 text-[11px]">↓</div>
            <div className="text-slate-600 text-[11px]">Disease-specific feature contribution</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">2. Pairwise Interaction (IS)</div>
            <div className="text-slate-400 text-[11px]">↓</div>
            <div className="text-slate-600 text-[11px]">Pairwise statistical coupling</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 font-mono">3. Pattern Membership m(P,Xi)</div>
            <div className="text-slate-400 text-[11px]">↓</div>
            <div className="text-slate-600 text-[11px]">Feature membership strength within learned pattern</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">4. Pattern Strength</div>
            <div className="text-slate-400 text-[11px]">↓</div>
            <div className="text-slate-600 text-[11px]">Unified evidence strength score of the learned pattern</div>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 6. DISEASE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 text-xs">
        {(['Diabetes', 'Heart Disease', 'CKD'] as const).map((disease) => {
          const patId = patternDescriptors[disease].id;
          const isSelected = selectedDisease === disease;

          return (
            <button
              key={disease}
              onClick={() => setSelectedDisease(disease)}
              className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{disease}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {patId}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 7. PRIMARY PATTERN HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {patternDescriptors[selectedDisease].id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Primary Disease Pattern
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {selectedDisease === 'Heart Disease'
                ? 'Heart Disease Primary Disease Pattern'
                : selectedDisease === 'Diabetes'
                ? 'Diabetes Primary Disease Pattern'
                : 'CKD Primary Disease Pattern'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Descriptor: <span className="text-slate-800">{patternDescriptors[selectedDisease].descriptor}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
              Validated Target: {selectedDisease}
            </span>
          </div>
        </div>

        {/* Statistical Statement (No Biological Cause Claim) */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Statistical Primary Pattern Assertion:</span>{' '}
          {patternDescriptors[selectedDisease].statisticalExplanation}
        </div>

        {/* ======================================================================= */}
        {/* 8. PRIMARY PATTERN SUMMARY */}
        {/* ======================================================================= */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Primary Pattern Summary
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
              <span className="text-indigo-700 font-bold block text-[11px]">HDPL Hierarchical Strength</span>
              <span className="font-black text-indigo-950 font-mono text-base mt-0.5">
                {activePattern?.hierarchicalStrength ? activePattern.hierarchicalStrength.toFixed(4) : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Stage 3.2 Pattern Strength</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activePattern?.originalStage32Score ? activePattern.originalStage32Score.toFixed(4) : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Primary Features</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {primaryFeatures.length}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Feature Coverage</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {primaryFeatures.length} / {validatedFeatureCount} ({(coverageRatio * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Supporting Interactions</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {supportingInteractions.length}
              </span>
            </div>

            {activePattern?.supportingSubPatterns && activePattern.supportingSubPatterns.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Supporting Sub-Patterns</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {activePattern.supportingSubPatterns.length}
                </span>
              </div>
            )}
          </div>


        </div>
      </div>



      {/* ========================================================================= */}
      {/* 11. LEVEL 1 — FEATURE EVIDENCE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              LEVEL 1 EVIDENCE
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Level 1 — Feature Evidence
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Learned feature-level attribution and normalized hierarchical contribution across validated features.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
              Primary: FI_norm ≥ 0.60
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Supporting: FI_norm &lt; 0.60
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3 text-right">Original FI</th>
                <th className="py-2.5 px-3 text-right">Normalized FI</th>
                <th className="py-2.5 px-3">Pattern Role</th>
                <th className="py-2.5 px-3">Configured Domain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePattern?.allRankedFeatures?.map((f, idx) => {
                const isPrimary = f.normalizedHierarchicalContribution >= 0.60;
                const roleLabel = isPrimary ? 'Primary Feature' : 'Supporting Feature';

                return (
                  <tr key={f.featureName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{f.featureName}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {f.originalContribution.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {f.normalizedHierarchicalContribution.toFixed(4)}
                    </td>
                    <td className="py-2 px-3">
                      {isPrimary ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {roleLabel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {roleLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{f.clinicalCategory}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-[11px] text-slate-500 font-medium pt-1">
          <strong>Classification Rule:</strong> Features satisfying the primary criterion (FI_norm ≥ 0.60) are designated as Primary Features. Features with FI_norm &lt; 0.60 contribute auxiliary signal and are designated as Supporting Features.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 12. LEVEL 2 — SUPPORTING INTERACTION EVIDENCE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              LEVEL 2 EVIDENCE
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Level 2 — Supporting Interaction Evidence
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Validated non-redundant interactions that provide supporting statistical evidence for the primary disease pattern.
            </p>
          </div>

          <div className="text-slate-500 text-[11px] font-mono">
            {supportingInteractions.length} Retained Pairs
          </div>
        </div>

        {supportingInteractions.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-center">
            No primary supporting interactions identified for this disease head.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-3">Interaction</th>
                  <th className="py-2.5 px-3">Evidence Tier</th>
                  <th className="py-2.5 px-3 text-right">Interaction Score</th>
                  <th className="py-2.5 px-3 text-right">MI</th>
                  <th className="py-2.5 px-3 text-right">NID</th>
                  <th className="py-2.5 px-3">Disease Association</th>
                  <th className="py-2.5 px-3">Redundancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supportingInteractions.map((int) => {
                  const isRedundant = int.redundancyStatus === 'Redundant';

                  return (
                    <tr key={int.pairId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                        {int.featureA} × {int.featureB}
                      </td>
                      <td className="py-2.5 px-3">
                        {int.classification === 'Strong' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Strong
                          </span>
                        ) : int.classification === 'Moderate' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Moderate
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Weak
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {int.interactionScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {int.mi.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {int.nidDelta !== undefined ? int.nidDelta.toFixed(3) : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {selectedDisease} Associated
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isRedundant ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Statistically Redundant
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                            Not Redundant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-[11px] text-slate-500 font-medium pt-1">
          <strong>Statistical Statement:</strong> Interactions listed represent statistically supported couplings associated with {selectedDisease} prediction. Statistical redundancy is enforced strictly when both high information overlap and low incremental predictive gain are present.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 14. LEVEL 3 — SUPPORTING SUB-PATTERNS (Only rendered if present) */}
      {/* ========================================================================= */}
      {activePattern?.supportingSubPatterns && activePattern.supportingSubPatterns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                LEVEL 3 EVIDENCE
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Level 3 — Supporting Sub-Patterns
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Coherent statistical clusters that explain subsets of the primary disease pattern.
              </p>
            </div>

            <div className="text-slate-500 text-[11px] font-mono">
              Sub-Patterns: {activePattern.supportingSubPatterns.length}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-3">Sub-Pattern ID</th>
                  <th className="py-2.5 px-3">Sub-Pattern Name</th>
                  <th className="py-2.5 px-3">Features</th>
                  <th className="py-2.5 px-3 text-right">Feature Contrib</th>
                  <th className="py-2.5 px-3 text-right">Interaction Contrib</th>
                  <th className="py-2.5 px-3 text-right">Sub-Pattern Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePattern.supportingSubPatterns.map((sp) => (
                  <tr key={sp.subPatternId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{sp.subPatternId}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{sp.subPatternName}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                      {sp.supportingFeatures.join(', ')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {sp.featureContribution.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {sp.interactionContribution.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {sp.subPatternStrength.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3 — CROSS-DISEASE PATTERN HYPOTHESES EVALUATION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                LEVEL 3 EVALUATION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Hypothesis Assessment
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Level 3 — Cross-Disease Pattern Hypotheses Evaluation
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              The system evaluates predefined cross-disease pattern hypotheses against learned disease cohort evidence.
            </p>
          </div>

          <div className="text-slate-500 text-[11px] font-mono">
            {hdplResult.sharedStatisticalPatterns.length} Evaluated Hypotheses
          </div>
        </div>

        <div className="space-y-2.5">
          {hdplResult.sharedStatisticalPatterns.map((shp) => (
            <div
              key={shp.sharedPatternId}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">{shp.sharedPatternId}</span>
                  <span className="font-bold text-slate-800">{shp.sharedPatternName}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  <span className="text-slate-500">Evaluated Cohorts:</span>
                  <span className="font-bold text-slate-900">{shp.associatedDiseases.join(' & ')}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    Similarity: {shp.similarityScore.toFixed(3)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                {shp.structuralDescription}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Shared Features: <strong className="text-slate-800">{shp.sharedFeatures.join(', ')}</strong></span>
                <span>•</span>
                <span>Shared Interactions: <strong className="text-slate-800">{shp.sharedInteractions.join(' | ')}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 18. SCIENTIFIC INTERPRETATION FOOTER */}
      {/* ========================================================================= */}
      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center leading-relaxed">
        Statistical interpretation only. Learned patterns reflect associations observed in the analyzed cohort and do not establish biological causation, clinical diagnosis, or individual patient disease probability.
      </div>
    </div>
  );
};
