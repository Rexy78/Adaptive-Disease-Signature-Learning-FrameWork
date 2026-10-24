import React, { useState, useMemo } from 'react';
import {
  RawRow,
  Module3InteractionDiscoveryResult,
  Stage3HierarchicalPatternResult,
  Stage3_3_SignatureResult,
  Stage3_4_XgbPredictionResult,
  Phase9Summary,
  Phase7Summary,
  FeatureMetrics,
} from '../types';
import { runPairwiseInteractionDiscovery } from '../utils/featureDiscoveryEngine';
import { runHierarchicalPatternLearning } from '../utils/patternLearningEngine';
import { buildDiseaseSignatures } from '../utils/diseaseSignatureEngine';
import { buildXgbPredictionModels } from '../utils/xgbPredictionEngine';
import { Module3InteractionDiscovery } from './Module3InteractionDiscovery';
import { Stage3HierarchicalPatternLearning } from './Stage3HierarchicalPatternLearning';
import { Stage3_3_DiseaseSignatures } from './Stage3_3_DiseaseSignatures';
import { Stage3_4_XgbPrediction } from './Stage3_4_XgbPrediction';
import { Module3ExecutiveAuditPanel } from './Module3ExecutiveAuditPanel';
import {
  Brain,
  GitFork,
  Layers,
  Dna,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface Module3KnowledgeHubProps {
  processedRows: RawRow[];
  activeSubView?: string;
  phase9Summary?: Phase9Summary | null;
  phase7Summary?: Phase7Summary | null;
  featureMetrics?: FeatureMetrics[];
  onNavigateSubView?: (viewId: string) => void;
}

export const Module3KnowledgeHub: React.FC<Module3KnowledgeHubProps> = ({
  processedRows,
  activeSubView = 'm3-interactions',
  onNavigateSubView,
}) => {
  // Determine current active stage from activeSubView
  const initialStage = useMemo(() => {
    if (activeSubView === 'm3-patterns' || activeSubView === 'm3-robustness') return '3.2';
    if (activeSubView === 'm3-signatures') return '3.3';
    if (activeSubView === 'm3-kaudpm') return '3.4';
    if (activeSubView === 'm3-audit') return 'audit';
    return '3.1';
  }, [activeSubView]);

  const [activeStage, setActiveStage] = useState<'3.1' | '3.2' | '3.3' | '3.4' | 'audit'>(initialStage);

  // Synchronize with external activeSubView prop changes
  React.useEffect(() => {
    if (activeSubView === 'm3-interactions' && activeStage !== '3.1') setActiveStage('3.1');
    if ((activeSubView === 'm3-patterns' || activeSubView === 'm3-robustness') && activeStage !== '3.2') setActiveStage('3.2');
    if (activeSubView === 'm3-signatures' && activeStage !== '3.3') setActiveStage('3.3');
    if (activeSubView === 'm3-kaudpm' && activeStage !== '3.4') setActiveStage('3.4');
    if (activeSubView === 'm3-audit' && activeStage !== 'audit') setActiveStage('audit');
  }, [activeSubView]);

  // Stage 3.1: Compute 171 pairs × 3 heads = 513 pairwise evaluations once (IMMUTABLE & CACHED)
  const discoveryResult: Module3InteractionDiscoveryResult = useMemo(() => {
    return runPairwiseInteractionDiscovery(processedRows);
  }, [processedRows]);

  // Stage 3.2: Learn 12 Patterns & Matrix 2 from Stage 3.1 (Lazy loaded when required)
  const patternResult = useMemo(() => {
    if (activeStage === '3.1') return null as any;
    return runHierarchicalPatternLearning(discoveryResult);
  }, [discoveryResult, activeStage]);

  // Stage 3.3: Construct 3 Disease Signatures & Cross-Disease Separation Matrix (Lazy loaded)
  const signatureResult = useMemo(() => {
    if (!patternResult || activeStage === '3.1' || activeStage === '3.2') return null as any;
    return buildDiseaseSignatures(patternResult, discoveryResult);
  }, [patternResult, discoveryResult, activeStage]);

  // Stage 3.4: Train 3 Independent XGBoost Classifiers & Patient Inference Engine (Lazy loaded)
  const kaUdpmResult = useMemo(() => {
    if (!patternResult || !signatureResult || (activeStage !== '3.4' && activeStage !== 'audit')) return null as any;
    return buildXgbPredictionModels(processedRows, patternResult, signatureResult, discoveryResult);
  }, [processedRows, patternResult, signatureResult, discoveryResult, activeStage]);

  const handleStageChange = (stage: '3.1' | '3.2' | '3.3' | '3.4' | 'audit') => {
    setActiveStage(stage);
    if (onNavigateSubView) {
      if (stage === '3.1') onNavigateSubView('m3-interactions');
      if (stage === '3.2') onNavigateSubView('m3-patterns');
      if (stage === '3.3') onNavigateSubView('m3-signatures');
      if (stage === '3.4') onNavigateSubView('m3-kaudpm');
      if (stage === 'audit') onNavigateSubView('m3-audit');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* MODULE 3 NAVIGATION HEADER */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-300">
            <span className="px-2 py-0.5 rounded bg-indigo-900/80 border border-indigo-700/60 font-bold">
              MODULE 3 AUDIT GATEWAY
            </span>
            <span>Universal Disease Prediction Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
            Hierarchical Clinical Knowledge Hub
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Data-driven interaction discovery, hierarchical pattern learning, 19-D disease signatures, and supervised XGBoost disease prediction.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 text-xs">
          <button
            onClick={() => handleStageChange('3.1')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeStage === '3.1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>3.1 Adaptive Discovery</span>
            {activeStage === '3.1' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-mono">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => handleStageChange('3.2')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeStage === '3.2'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3.2 Hierarchical Patterns</span>
            {activeStage === '3.2' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-mono">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => handleStageChange('3.3')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeStage === '3.3'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>3.3 Disease Signatures</span>
            {activeStage === '3.3' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-mono">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => handleStageChange('3.4')}
            title="Supervised XGBoost Risk Inference Engine"
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeStage === '3.4'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>3.4 XGBoost Prediction</span>
            {activeStage === '3.4' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-mono">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => handleStageChange('audit')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeStage === 'audit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Module 3 Executive Audit</span>
          </button>
        </div>
      </div>

      {/* STAGE 3.1: ADAPTIVE CLINICAL INTERACTION DISCOVERY */}
      {activeStage === '3.1' && (
        <Module3InteractionDiscovery
          discoveryResult={discoveryResult}
          onNavigateToStage={(stg) => {
            if (stg === '3.2') handleStageChange('3.2');
            if (stg === '3.3') handleStageChange('3.3');
            if (stg === '3.4') handleStageChange('3.4');
            if (stg === 'audit') handleStageChange('audit');
          }}
        />
      )}

      {/* STAGE 3.2: HIERARCHICAL DISEASE PATTERN LEARNING */}
      {activeStage === '3.2' && (
        <Stage3HierarchicalPatternLearning
          discoveryResult={discoveryResult}
          onNavigateToStage={(stg) => {
            if (stg === '3.1') handleStageChange('3.1');
            if (stg === '3.3') handleStageChange('3.3');
            if (stg === '3.4') handleStageChange('3.4');
            if (stg === 'audit') handleStageChange('audit');
          }}
        />
      )}

      {/* STAGE 3.3: DISEASE SIGNATURE CONSTRUCTION */}
      {activeStage === '3.3' && (
        <Stage3_3_DiseaseSignatures
          patternResult={patternResult}
          discoveryResult={discoveryResult}
          onNavigateToStage={(stg) => {
            if (stg === '3.1') handleStageChange('3.1');
            if (stg === '3.2') handleStageChange('3.2');
            if (stg === '3.4') handleStageChange('3.4');
            if (stg === 'audit') handleStageChange('audit');
          }}
        />
      )}

      {/* STAGE 3.4: XGBOOST DISEASE PREDICTION & RISK */}
      {activeStage === '3.4' && (
        <Stage3_4_XgbPrediction
          processedRows={processedRows}
          patternResult={patternResult}
          signatureResult={signatureResult}
          discoveryResult={discoveryResult}
          onNavigateToStage={(stg) => {
            if (stg === '3.1') handleStageChange('3.1');
            if (stg === '3.2') handleStageChange('3.2');
            if (stg === '3.3') handleStageChange('3.3');
            if (stg === 'audit') handleStageChange('audit');
            if (stg.startsWith('m4-')) onNavigateSubView?.(stg);
          }}
        />
      )}

      {/* FINAL EXECUTIVE AUDIT & PIPELINE COMPLETION GATE */}
      {activeStage === 'audit' && (
        <Module3ExecutiveAuditPanel
          discoveryResult={discoveryResult}
          patternResult={patternResult}
          signatureResult={signatureResult}
          kaUdpmResult={kaUdpmResult}
          onNavigateToStage={(stg) => {
            if (stg === '3.1') handleStageChange('3.1');
            if (stg === '3.2') handleStageChange('3.2');
            if (stg === '3.3') handleStageChange('3.3');
            if (stg === '3.4') handleStageChange('3.4');
          }}
        />
      )}
    </div>
  );
};
