import {
  HierarchicalDiseaseGraph,
  HierarchicalGraphNode,
  HierarchicalGraphEdge,
  HierarchicalDiseaseNode,
  HierarchicalPatternNode,
  HierarchicalFeatureNode,
  HierarchicalStructuralEdge,
  HierarchicalInteractionEdge,
  LearnedDiseasePattern,
  DiseaseInteractionMatrix,
  DiseaseInteractionPair,
} from '../types';
import {
  CANONICAL_19_FEATURE_NAMES,
  FEATURE_DOMAIN_MAP,
  getBiomarkerTier,
} from './patternLearningEngine';

export const DISEASE_TARGET_DEFINITIONS: Record<'Diabetes' | 'Heart Disease' | 'CKD', { fullName: string; targetDef: string }> = {
  Diabetes: {
    fullName: 'Type 2 Diabetes Mellitus Head',
    targetDef: 'Glycemic Dysregulation & Metabolic Syndrome Endpoint',
  },
  'Heart Disease': {
    fullName: 'Cardiovascular Disease Head',
    targetDef: 'Cardiorenal–Vascular Damage & Hemodynamic Stress Endpoint',
  },
  CKD: {
    fullName: 'Chronic Kidney Disease Head',
    targetDef: 'Renal Parenchymal Breakdown & Filtration Impairment Endpoint',
  },
};

export interface BuildGraphParams {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  pattern: LearnedDiseasePattern;
  diseaseMatrix: DiseaseInteractionMatrix;
  minInteractionScore?: number;
}

/**
 * Builds a crystal-clear, structured hierarchical disease knowledge graph.
 * 
 * Specifically optimized for interpretability and downstream XGBoost ingestion:
 * - Level 0: Disease Target Head (Header node)
 * - Level 1: Primary Disease Pattern (Domain & Strength)
 * - Level 2: 3 Clear Tier Swimlanes (Core, Supporting, Contextual)
 * - Level 3: Formatted Biomarker Feature Cards holding m(d, Xi), FC, and IC
 * - Level 4: Clean curved interaction edges with non-overlapping geometry and anchor badge
 */
export function buildHierarchicalDiseaseGraph({
  disease,
  pattern,
  diseaseMatrix,
  minInteractionScore = 0.20,
}: BuildGraphParams): HierarchicalDiseaseGraph {
  const diseaseMeta = DISEASE_TARGET_DEFINITIONS[disease];
  const nodes: HierarchicalGraphNode[] = [];
  const edges: HierarchicalGraphEdge[] = [];

  // Canvas bounds: Width = 1200, Height = 820
  const centerX = 600;

  // 1. Level 0: Disease Target Node (Top Center)
  const diseaseNodeId = `NODE-DIS-${disease === 'Diabetes' ? 'DM' : disease === 'Heart Disease' ? 'HD' : 'CKD'}`;
  const diseaseNode: HierarchicalDiseaseNode = {
    id: diseaseNodeId,
    type: 'DISEASE',
    diseaseId: disease,
    diseaseName: diseaseMeta.fullName,
    targetDefinition: diseaseMeta.targetDef,
    patternId: pattern.patternId,
    level: 0,
    x: centerX,
    y: 45,
  };
  nodes.push(diseaseNode);

  // 2. Level 1: Primary Pattern Node (Below Disease Header)
  const patternNodeId = `NODE-PAT-${pattern.patternId}`;
  const patternNode: HierarchicalPatternNode = {
    id: patternNodeId,
    type: 'PATTERN',
    patternId: pattern.patternId,
    diseaseId: disease,
    patternDomain: pattern.dominantDomain,
    evidenceDomains: pattern.dominantEvidenceDomains || pattern.dominantDomain,
    patternStrength: pattern.patternStrength,
    featureContribution: pattern.featureContribution,
    interactionContribution: pattern.interactionContribution,
    coreCount: pattern.coreFeatures.length,
    supportingCount: pattern.supportingFeatures.length,
    contextualCount: pattern.nonMemberFeatures.length,
    level: 1,
    x: centerX,
    y: 115,
  };
  nodes.push(patternNode);

  // Structural edge: Disease -> Pattern
  const hasPatternEdge: HierarchicalStructuralEdge = {
    id: `EDGE-STRUCT-PAT-${disease}-${pattern.patternId}`,
    type: 'HAS_PATTERN',
    source: diseaseNodeId,
    target: patternNodeId,
    diseaseId: disease,
    sourceStage: 'Stage 3.2 Hierarchical Disease Pattern Learning',
  };
  edges.push(hasPatternEdge);

  // 3. Precompute Feature Importance & Interaction Degree maps from Stage 3.1
  const pairsMap = new Map<string, DiseaseInteractionPair>();
  diseaseMatrix.rankedPairs.forEach((p) => {
    pairsMap.set(`${p.featureA}_${p.featureB}`, p);
    pairsMap.set(`${p.featureB}_${p.featureA}`, p);
  });

  const rawFIMap = new Map<string, number>();
  CANONICAL_19_FEATURE_NAMES.forEach((feat) => {
    const graphNode = diseaseMatrix.graph?.nodes?.find((n) => n.name === feat);
    if (graphNode && typeof graphNode.individualFeatureImportance === 'number') {
      rawFIMap.set(feat, graphNode.individualFeatureImportance);
    } else {
      const associated = diseaseMatrix.rankedPairs.filter(
        (p) => p.featureA === feat || p.featureB === feat
      );
      const avg = associated.length > 0
        ? associated.reduce((acc, p) => acc + p.featureImportanceContrib, 0) / associated.length
        : 0.1;
      rawFIMap.set(feat, avg);
    }
  });

  const maxFI = Math.max(...Array.from(rawFIMap.values()), 0.001);

  const degMap = new Map<string, number>();
  CANONICAL_19_FEATURE_NAMES.forEach((feat) => {
    let sum = 0;
    CANONICAL_19_FEATURE_NAMES.forEach((other) => {
      if (feat !== other) {
        const pair = pairsMap.get(`${feat}_${other}`);
        if (pair) sum += pair.interactionScore;
      }
    });
    degMap.set(feat, sum);
  });

  // 4. Structured High-Clarity Tier Swimlane Coordinates
  // Swimlane centers:
  // Column 1 (Core): x = 210
  // Column 2 (Supporting): x = 600
  // Column 3 (Contextual): x = 990
  const coreFeats = pattern.coreFeatures;
  const suppFeats = pattern.supportingFeatures;
  const ctxFeats = pattern.nonMemberFeatures;

  const positions = new Map<string, { x: number; y: number }>();

  // Layout Core Features: single prominent column
  const coreStartY = 260;
  const coreStepY = Math.min(85, Math.max(68, 480 / Math.max(1, coreFeats.length)));
  coreFeats.forEach((feat, idx) => {
    positions.set(feat, {
      x: 210,
      y: coreStartY + idx * coreStepY,
    });
  });

  // Layout Supporting Features: single column if <= 6, 2 neat columns if > 6
  const suppStartY = 260;
  if (suppFeats.length <= 7) {
    const suppStepY = Math.min(80, Math.max(60, 480 / Math.max(1, suppFeats.length)));
    suppFeats.forEach((feat, idx) => {
      positions.set(feat, {
        x: 600,
        y: suppStartY + idx * suppStepY,
      });
    });
  } else {
    // 2 sub-columns for Supporting
    const half = Math.ceil(suppFeats.length / 2);
    const suppStepY = Math.min(68, Math.max(52, 460 / half));
    suppFeats.forEach((feat, idx) => {
      const col = idx < half ? 0 : 1;
      const row = idx < half ? idx : idx - half;
      positions.set(feat, {
        x: col === 0 ? 510 : 690,
        y: suppStartY + row * suppStepY,
      });
    });
  }

  // Layout Contextual Features: single column if <= 6, 2 sub-columns if > 6
  const ctxStartY = 260;
  if (ctxFeats.length <= 6) {
    const ctxStepY = Math.min(80, Math.max(54, 480 / Math.max(1, ctxFeats.length)));
    ctxFeats.forEach((feat, idx) => {
      positions.set(feat, {
        x: 990,
        y: ctxStartY + idx * ctxStepY,
      });
    });
  } else {
    const half = Math.ceil(ctxFeats.length / 2);
    const ctxStepY = Math.min(64, Math.max(48, 460 / half));
    ctxFeats.forEach((feat, idx) => {
      const col = idx < half ? 0 : 1;
      const row = idx < half ? idx : idx - half;
      positions.set(feat, {
        x: col === 0 ? 915 : 1070,
        y: ctxStartY + row * ctxStepY,
      });
    });
  }

  // 5. Construct Biomarker Feature Nodes (Level 3)
  const featureNodeIdMap = new Map<string, string>();

  CANONICAL_19_FEATURE_NAMES.forEach((feat) => {
    const mem = pattern.membershipScores[feat] ?? 0.0;
    const tier = getBiomarkerTier(mem);
    const rawFi = rawFIMap.get(feat) || 0;
    const normFi = rawFi / maxFI;
    const deg = degMap.get(feat) || 0;
    const domain = FEATURE_DOMAIN_MAP.get(feat) || 'Clinical Laboratory';
    const nodeId = `NODE-FEAT-${disease}-${feat}`;
    featureNodeIdMap.set(feat, nodeId);

    const pos = positions.get(feat) || { x: centerX, y: 350 };

    const featureNode: HierarchicalFeatureNode = {
      id: nodeId,
      type: 'FEATURE',
      featureId: feat,
      featureName: feat,
      clinicalDomain: domain,
      membership: mem,
      normalizedFi: Math.round(normFi * 10000) / 10000,
      rawFi: Math.round(rawFi * 10000) / 10000,
      hierarchyTier: tier,
      interactionDegree: Math.round(deg * 10000) / 10000,
      level: 3,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
    };
    nodes.push(featureNode);

    // Structural Edge from Pattern to Feature
    let edgeType: HierarchicalStructuralEdge['type'] = 'HAS_CONTEXTUAL_FEATURE';
    if (tier === 'Core') edgeType = 'HAS_CORE_FEATURE';
    else if (tier === 'Supporting') edgeType = 'HAS_SUPPORTING_FEATURE';

    const structEdge: HierarchicalStructuralEdge = {
      id: `EDGE-STRUCT-${disease}-${pattern.patternId}-${feat}`,
      type: edgeType,
      source: patternNodeId,
      target: nodeId,
      diseaseId: disease,
      sourceStage: 'Stage 3.2 Membership Derivation',
    };
    edges.push(structEdge);
  });

  // 6. Construct Feature-to-Feature Stage 3.1 Interaction Edges (INTERACTS_WITH)
  const renderedPairs = new Set<string>();

  diseaseMatrix.rankedPairs.forEach((p) => {
    if (p.isRedundant) return;
    if (p.interactionScore < minInteractionScore) return;

    if (!featureNodeIdMap.has(p.featureA) || !featureNodeIdMap.has(p.featureB)) return;

    const pairKey = [p.featureA, p.featureB].sort().join('_');
    if (renderedPairs.has(pairKey)) return;
    renderedPairs.add(pairKey);

    const sourceId = featureNodeIdMap.get(p.featureA)!;
    const targetId = featureNodeIdMap.get(p.featureB)!;

    const interactionEdge: HierarchicalInteractionEdge = {
      id: `EDGE-INT-${disease}-${p.pairId}`,
      type: 'INTERACTS_WITH',
      source: sourceId,
      target: targetId,
      featureA: p.featureA,
      featureB: p.featureB,
      diseaseId: disease,
      interactionScore: p.interactionScore,
      mi: p.mi,
      absoluteCorrelation: Math.abs(p.corrRaw),
      coOccurrence: p.coOccurrence,
      fiAttribution: p.featureImportanceContrib,
      nidDelta: p.nid,
      classification: p.status,
      stage_3_1_source: 'Stage 3.1 Interaction Discovery (Locked Matrix 1)',
      graph_edge_status: p.status,
      pairId: p.pairId,
    };
    edges.push(interactionEdge);
  });

  const structuralEdgesCount = edges.filter((e) => e.type !== 'INTERACTS_WITH').length;
  const interactionEdgesCount = edges.filter((e) => e.type === 'INTERACTS_WITH').length;

  return {
    diseaseId: disease,
    diseaseName: diseaseMeta.fullName,
    patternId: pattern.patternId,
    targetDefinition: diseaseMeta.targetDef,
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      structuralEdgesCount,
      interactionEdgesCount,
      version: 'Stage 3.2 Canonical v1.0',
      timestamp: new Date().toISOString(),
      lockedSource: 'Stage 3.1 Pairwise Interaction Discovery & Matrix 2',
    },
  };
}

/**
 * Serialize a hierarchical disease graph into formatted JSON string for export.
 */
export function exportHierarchicalGraphJSON(graph: HierarchicalDiseaseGraph): string {
  return JSON.stringify(graph, null, 2);
}
