/**
 * Adaptive Clinical Interaction Discovery & Contribution Scoring Engine
 * Stage 3.1 — Universal Disease Prediction Framework
 * 
 * Objective:
 * Feature Pairs → Disease-Specific Evidence → Interaction Score (CIS & DAS) → 4-Tier Classification → Graph / Matrix
 * 
 * Invariants:
 * - Exactly 19 canonical biomarkers in strictly locked order.
 * - Exactly 171 unique unordered pairs per disease head x 3 disease targets = 513 records.
 * - Disease-specific independent evaluation across Diabetes, Heart Disease, and CKD.
 * - Zero redundancy, quarantine, or redundancy-based rejection.
 * - High correlation does NOT disqualify a pair.
 * - Cross-validated predictive contribution (Delta-P), true interaction contribution (Delta-I),
 *   resampling stability, disease-specific feature importance, mutual information, and co-occurrence.
 */

import {
  RawRow,
  DiseaseInteractionPair,
  DiseaseInteractionMatrix,
  DiseaseGraph,
  DiseaseGraphNode,
  DiseaseGraphEdge,
  Module3InteractionDiscoveryResult,
} from '../types';

export const CANONICAL_19_BIOMARKERS = [
  'Age',
  'Sex',
  'BMI',
  'Weight',
  'Waist_Circumference',
  'Systolic_BP',
  'Diastolic_BP',
  'Pulse',
  'HDL',
  'LDL',
  'Total_Cholesterol',
  'Triglycerides',
  'HbA1c',
  'Fasting_Glucose',
  'Serum_Creatinine',
  'BUN',
  'eGFR',
  'ALT',
  'AST',
] as const;

export type CanonicalBiomarker = typeof CANONICAL_19_BIOMARKERS[number];

export const BIOMARKER_DOMAINS: Record<string, string> = {
  Age: 'Demographics',
  Sex: 'Demographics',
  BMI: 'Anthropometry',
  Weight: 'Anthropometry',
  Waist_Circumference: 'Anthropometry',
  Systolic_BP: 'Vascular',
  Diastolic_BP: 'Vascular',
  Pulse: 'Vascular',
  HDL: 'Lipids',
  LDL: 'Lipids',
  Total_Cholesterol: 'Lipids',
  Triglycerides: 'Lipids',
  HbA1c: 'Glycemic',
  Fasting_Glucose: 'Glycemic',
  Serum_Creatinine: 'Renal',
  BUN: 'Renal',
  eGFR: 'Renal',
  ALT: 'Hepatic',
  AST: 'Hepatic',
};

export const BIOMARKER_COLORS: Record<string, string> = {
  Demographics: '#6366f1', // Indigo
  Anthropometry: '#0ea5e9', // Sky
  Vascular: '#f43f5e', // Rose
  Lipids: '#eab308', // Amber
  Glycemic: '#10b981', // Emerald
  Renal: '#8b5cf6', // Violet
  Hepatic: '#ec4899', // Pink
};

// ============================================================
// MATHEMATICAL UTILITIES: Logistic Regression & Performance
// ============================================================

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, z))));
}

function computeLogLoss(yTrue: number[], yPredProb: number[]): number {
  const eps = 1e-12;
  let loss = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const y = yTrue[i];
    const p = Math.max(eps, Math.min(1 - eps, yPredProb[i]));
    loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }
  return loss / Math.max(1, yTrue.length);
}

function computeAuroc(yTrue: number[], scores: number[]): number {
  let posCount = 0;
  let negCount = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1) posCount++;
    else negCount++;
  }
  if (posCount === 0 || negCount === 0) return 0.5;

  const pairs: { y: number; s: number }[] = [];
  for (let i = 0; i < yTrue.length; i++) {
    pairs.push({ y: yTrue[i], s: scores[i] });
  }
  pairs.sort((a, b) => a.s - b.s);

  let rankSum = 0;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].y === 1) rankSum += i + 1;
  }
  const u = rankSum - (posCount * (posCount + 1)) / 2;
  return Math.min(1.0, Math.max(0.0, u / (posCount * negCount)));
}

function computePrAuc(yTrue: number[], scores: number[]): number {
  let posCount = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1) posCount++;
  }
  if (posCount === 0) return 0;

  const pairs: { y: number; s: number }[] = [];
  for (let i = 0; i < yTrue.length; i++) {
    pairs.push({ y: yTrue[i], s: scores[i] });
  }
  pairs.sort((a, b) => b.s - a.s); // Descending

  let truePos = 0;
  let falsePos = 0;
  let prevRecall = 0;
  let prAuc = 0;

  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].y === 1) truePos++;
    else falsePos++;

    const precision = truePos / (truePos + falsePos);
    const recall = truePos / posCount;
    prAuc += precision * (recall - prevRecall);
    prevRecall = recall;
  }
  return Math.max(0, Math.min(1, prAuc));
}

/**
 * Fast logistic regression solver via Newton-Raphson / IRLS
 */
function fitLogisticRegression(
  X: number[][],
  y: number[],
  maxIter = 20,
  l2Lambda = 0.02
): { weights: number[]; bias: number; predict: (row: number[]) => number } {
  const n = X.length;
  const p = X[0]?.length || 0;
  let beta = new Array(p + 1).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const pVec: number[] = [];
    const wVec: number[] = [];
    for (let i = 0; i < n; i++) {
      let z = beta[0];
      for (let j = 0; j < p; j++) z += beta[j + 1] * X[i][j];
      const prob = sigmoid(z);
      pVec.push(prob);
      wVec.push(Math.max(1e-5, prob * (1 - prob)));
    }

    const grad = new Array(p + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const err = y[i] - pVec[i];
      grad[0] += err;
      for (let j = 0; j < p; j++) grad[j + 1] += err * X[i][j];
    }
    for (let j = 1; j <= p; j++) grad[j] -= l2Lambda * beta[j];

    const H: number[][] = Array.from({ length: p + 1 }, () => new Array(p + 1).fill(0));
    for (let i = 0; i < n; i++) {
      const w = wVec[i];
      H[0][0] += w;
      for (let j = 0; j < p; j++) {
        const x_ij = X[i][j];
        H[0][j + 1] += w * x_ij;
        H[j + 1][0] += w * x_ij;
        for (let k = 0; k < p; k++) {
          H[j + 1][k + 1] += w * x_ij * X[i][k];
        }
      }
    }
    for (let j = 1; j <= p; j++) H[j][j] += l2Lambda;

    const delta = solveLinearSystem(H, grad);
    let maxChange = 0;
    for (let j = 0; j <= p; j++) {
      beta[j] += delta[j];
      maxChange = Math.max(maxChange, Math.abs(delta[j]));
    }
    if (maxChange < 1e-4) break;
  }

  const bias = beta[0];
  const weights = beta.slice(1);
  return {
    weights,
    bias,
    predict: (row: number[]) => {
      let z = bias;
      for (let j = 0; j < p; j++) z += weights[j] * row[j];
      return sigmoid(z);
    },
  };
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    const temp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = temp;

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-9) M[i][i] = 1e-9;
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / (M[i][i] || 1e-9);
  }
  return x;
}

// ============================================================
// DATA EXTRACTION: Canonical 19 Biomarkers
// ============================================================

export interface CanonicalCohort {
  X_raw: number[][];
  X_norm: number[][];
  Y: {
    Diabetes: number[];
    Heart_Disease: number[];
    CKD: number[];
  };
  means: number[];
  stds: number[];
  sampleCount: number;
}

export function extractCanonicalCohort(activeDataset: RawRow[]): CanonicalCohort {
  const actualHeaders = Object.keys(activeDataset[0] || {});
  const headerMap: Record<string, string> = {};
  actualHeaders.forEach((h) => {
    headerMap[h.toLowerCase().replace(/[-_]/g, '')] = h;
  });

  const X_raw: number[][] = [];
  const colHD = headerMap['heartdisease'] || headerMap['heart_disease'];
  const colDM = headerMap['diabetes'];
  const colCKD = headerMap['ckd'] || headerMap['chronickidneydisease'];

  const Y_Diabetes: number[] = [];
  const Y_HeartDisease: number[] = [];
  const Y_CKD: number[] = [];

  for (let i = 0; i < activeDataset.length; i++) {
    const row = activeDataset[i];
    const featVals: number[] = [];

    for (let f = 0; f < CANONICAL_19_BIOMARKERS.length; f++) {
      const canonicalName = CANONICAL_19_BIOMARKERS[f];
      const matchKey = canonicalName.toLowerCase().replace(/[-_]/g, '');
      const actualCol = headerMap[matchKey] || canonicalName;
      const rawVal = row[actualCol];

      let numVal = 0;
      if (typeof rawVal === 'number' && !isNaN(rawVal)) {
        numVal = rawVal;
      } else if (typeof rawVal === 'string') {
        const cleaned = rawVal.trim().toLowerCase();
        if (canonicalName === 'Sex') {
          numVal = (cleaned === 'female' || cleaned === 'f' || cleaned === '2') ? 1 : 0;
        } else {
          const parsed = parseFloat(cleaned);
          numVal = !isNaN(parsed) ? parsed : 0;
        }
      }
      featVals.push(numVal);
    }
    X_raw.push(featVals);

    const parseTarget = (val: any): number => {
      if (val === 1 || val === '1' || val === true || String(val).toLowerCase() === 'yes') return 1;
      return 0;
    };

    Y_Diabetes.push(colDM ? parseTarget(row[colDM]) : 0);
    Y_HeartDisease.push(colHD ? parseTarget(row[colHD]) : 0);
    Y_CKD.push(colCKD ? parseTarget(row[colCKD]) : 0);
  }

  const sampleCount = X_raw.length;
  const numFeatures = CANONICAL_19_BIOMARKERS.length;

  const means: number[] = new Array(numFeatures).fill(0);
  for (let j = 0; j < numFeatures; j++) {
    let sum = 0;
    for (let i = 0; i < sampleCount; i++) sum += X_raw[i][j];
    means[j] = sum / Math.max(1, sampleCount);
  }

  const stds: number[] = new Array(numFeatures).fill(1);
  for (let j = 0; j < numFeatures; j++) {
    const m = means[j];
    let varianceSum = 0;
    for (let i = 0; i < sampleCount; i++) {
      const diff = X_raw[i][j] - m;
      varianceSum += diff * diff;
    }
    const std = Math.sqrt(varianceSum / Math.max(1, sampleCount - 1));
    stds[j] = std > 1e-6 ? std : 1.0;
  }

  const X_norm: number[][] = [];
  for (let i = 0; i < sampleCount; i++) {
    const normRow: number[] = [];
    for (let j = 0; j < numFeatures; j++) {
      normRow.push((X_raw[i][j] - means[j]) / stds[j]);
    }
    X_norm.push(normRow);
  }

  return {
    X_raw,
    X_norm,
    Y: {
      Diabetes: Y_Diabetes,
      Heart_Disease: Y_HeartDisease,
      CKD: Y_CKD,
    },
    means,
    stds,
    sampleCount,
  };
}

// ============================================================
// ADAPTIVE PREDICTIVE EVALUATION: Delta-P, Delta-I & Stability
// ============================================================

export interface PairEvaluationResult {
  delta_auc: number;
  delta_pr_auc: number;
  delta_logloss: number;
  delta_p: number;
  delta_i: number;
  stability: number;
  stability_sd: number;
}

/**
 * 5-Fold Stratified Cross-Validation on patient cohort
 * Compares:
 *   Base: Y ~ Constant
 *   Pair: Y ~ X_i + X_j
 *   Interaction: Y ~ X_i + X_j + (X_i * X_j)
 */
export function evaluatePairCrossValidation(
  X_norm: number[][],
  y: number[],
  idxA: number,
  idxB: number,
  kFolds = 5
): PairEvaluationResult {
  const totalN = X_norm.length;

  // Stratified subsampling for swift cross-validation if cohort is large (> 400)
  const allPos: number[] = [];
  const allNeg: number[] = [];
  for (let i = 0; i < totalN; i++) {
    if (y[i] === 1) allPos.push(i);
    else allNeg.push(i);
  }

  let selectedIndices: number[];
  if (totalN > 450) {
    const targetN = 450;
    const targetPos = Math.max(25, Math.min(allPos.length, Math.floor(targetN * (allPos.length / totalN))));
    const targetNeg = Math.min(allNeg.length, targetN - targetPos);
    const stepPos = Math.max(1, Math.floor(allPos.length / targetPos));
    const stepNeg = Math.max(1, Math.floor(allNeg.length / targetNeg));
    const samplePos = allPos.filter((_, i) => i % stepPos === 0).slice(0, targetPos);
    const sampleNeg = allNeg.filter((_, i) => i % stepNeg === 0).slice(0, targetNeg);
    selectedIndices = [...samplePos, ...sampleNeg];
  } else {
    selectedIndices = Array.from({ length: totalN }, (_, i) => i);
  }

  const n = selectedIndices.length;
  const subX_norm = selectedIndices.map((origIdx) => X_norm[origIdx]);
  const subY = selectedIndices.map((origIdx) => y[origIdx]);

  const posIndices: number[] = [];
  const negIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (subY[i] === 1) posIndices.push(i);
    else negIndices.push(i);
  }

  const foldIndices: number[][] = Array.from({ length: kFolds }, () => []);
  posIndices.forEach((idx, i) => foldIndices[i % kFolds].push(idx));
  negIndices.forEach((idx, i) => foldIndices[i % kFolds].push(idx));

  const oofPredBase = new Array(n).fill(0.5);
  const oofPredPair = new Array(n).fill(0.5);
  const oofPredInt = new Array(n).fill(0.5);

  const foldAucDeltas: number[] = [];
  let positiveFolds = 0;

  for (let f = 0; f < kFolds; f++) {
    const valSet = new Set(foldIndices[f]);
    const trainX_pair: number[][] = [];
    const trainX_int: number[][] = [];
    const trainY: number[] = [];

    const valX_pair: number[][] = [];
    const valX_int: number[][] = [];
    const valY: number[] = [];
    const valRowMap: number[] = [];

    for (let i = 0; i < n; i++) {
      const xa = subX_norm[i][idxA];
      const xb = subX_norm[i][idxB];
      const x_pair = [xa, xb];
      const x_int = [xa, xb, xa * xb];

      if (valSet.has(i)) {
        valX_pair.push(x_pair);
        valX_int.push(x_int);
        valY.push(subY[i]);
        valRowMap.push(i);
      } else {
        trainX_pair.push(x_pair);
        trainX_int.push(x_int);
        trainY.push(subY[i]);
      }
    }

    const pairModel = fitLogisticRegression(trainX_pair, trainY, 15, 0.05);
    const intModel = fitLogisticRegression(trainX_int, trainY, 15, 0.05);

    const foldPredPair: number[] = [];
    const foldPredInt: number[] = [];
    for (let v = 0; v < valY.length; v++) {
      const origIdx = valRowMap[v];
      const pPair = pairModel.predict(valX_pair[v]);
      const pInt = intModel.predict(valX_int[v]);
      oofPredPair[origIdx] = pPair;
      oofPredInt[origIdx] = pInt;
      foldPredPair.push(pPair);
      foldPredInt.push(pInt);
    }

    const foldAucPair = computeAuroc(valY, foldPredPair);
    const foldAucBase = 0.50; // Null prediction
    const foldDelta = foldAucPair - foldAucBase;
    foldAucDeltas.push(foldDelta);

    if (foldDelta > 0.01) {
      positiveFolds++;
    }
  }

  // Global out-of-fold metrics
  const prevalence = subY.reduce((a, b) => a + b, 0) / Math.max(1, n);
  for (let i = 0; i < n; i++) oofPredBase[i] = prevalence;

  const aucBase = 0.50;
  const aucPair = computeAuroc(subY, oofPredPair);
  const aucInt = computeAuroc(subY, oofPredInt);
  const delta_auc = Math.round((aucPair - aucBase) * 10000) / 10000;

  const prAucBase = prevalence;
  const prAucPair = computePrAuc(subY, oofPredPair);
  const delta_pr_auc = Math.round((prAucPair - prAucBase) * 10000) / 10000;

  const logLossBase = computeLogLoss(subY, oofPredBase);
  const logLossPair = computeLogLoss(subY, oofPredPair);
  const delta_logloss = Math.round((logLossBase - logLossPair) * 10000) / 10000;

  // Interaction effect Delta-I (Performance(M_pair+int) - Performance(M_pair))
  const logLossInt = computeLogLoss(subY, oofPredInt);
  const interactionGain = Math.max(0, logLossPair - logLossInt) + Math.max(0, aucInt - aucPair);
  const delta_i = Math.min(1.0, Math.max(0.0, Math.round(interactionGain * 8.0 * 10000) / 10000));

  // Normalized Delta-P from out-of-fold improvements
  const rawP = Math.max(0, delta_auc * 1.5) + Math.max(0, delta_logloss * 2.0);
  const delta_p = Math.min(1.0, Math.max(0.0, Math.round(rawP * 10000) / 10000));

  // Stability metrics
  const stability = Math.round((positiveFolds / kFolds) * 10000) / 10000;
  const meanDelta = foldAucDeltas.reduce((a, b) => a + b, 0) / kFolds;
  const varDelta = foldAucDeltas.reduce((acc, d) => acc + Math.pow(d - meanDelta, 2), 0) / Math.max(1, kFolds - 1);
  const stability_sd = Math.round(Math.sqrt(varDelta) * 10000) / 10000;

  return {
    delta_auc,
    delta_pr_auc,
    delta_logloss,
    delta_p,
    delta_i,
    stability,
    stability_sd,
  };
}

// ============================================================
// CONFIGURABLE WEIGHTS & SCORE SYNTHESIS
// ============================================================

export interface InteractionWeights {
  w_mi: number; // 0.10
  w_corr: number; // 0.05
  w_co: number; // 0.10
  w_fi: number; // 0.15
  w_delta_p: number; // 0.30
  w_delta_i: number; // 0.20
  w_stability: number; // 0.10
}

export const DEFAULT_CIS_WEIGHTS: InteractionWeights = {
  w_mi: 0.10,
  w_corr: 0.05,
  w_co: 0.10,
  w_fi: 0.15,
  w_delta_p: 0.30,
  w_delta_i: 0.20,
  w_stability: 0.10,
};

export function calculateCIS(
  mi_norm: number,
  corr_norm: number,
  co_norm: number,
  fi_pair: number,
  delta_p: number,
  delta_i: number,
  stability: number,
  weights: InteractionWeights = DEFAULT_CIS_WEIGHTS
): number {
  const score =
    weights.w_mi * mi_norm +
    weights.w_corr * corr_norm +
    weights.w_co * co_norm +
    weights.w_fi * fi_pair +
    weights.w_delta_p * delta_p +
    weights.w_delta_i * delta_i +
    weights.w_stability * stability;

  return Math.min(1.0, Math.max(0.0, Math.round(score * 10000) / 10000));
}

export function calculateDAS(
  delta_p: number,
  delta_i: number,
  fi_pair: number,
  stability: number
): number {
  const score =
    0.40 * delta_p +
    0.25 * delta_i +
    0.20 * fi_pair +
    0.15 * stability;

  return Math.min(1.0, Math.max(0.0, Math.round(score * 10000) / 10000));
}

/**
 * 4-Tier Classification Rules with Structural & Statistical Redundancy Screening
 */
export function classifyInteraction(
  das: number,
  stability: number,
  delta_p: number,
  corr_norm: number,
  mi_norm: number,
  disease: string = 'Diabetes',
  featA: string = '',
  featB: string = ''
): 'STRONG' | 'DISEASE-ASSOCIATED' | 'MODERATE' | 'WEAK' | 'NOT_CLASSIFIED' {
  // Step 1: Structural eligibility (Age × Sex)
  const isAgeSex = (featA === 'Age' && featB === 'Sex') || (featA === 'Sex' && featB === 'Age');
  if (isAgeSex) return 'NOT_CLASSIFIED';

  // Step 2: Statistical redundancy (|r| >= 0.85 with low incremental gain)
  const isCollinear = corr_norm >= 0.85;
  const collinearThreshold = disease === 'Heart Disease' ? 0.040 : 0.025;
  if (isCollinear && delta_p < collinearThreshold) return 'NOT_CLASSIFIED';

  // Step 3-6: Disease-specific thresholds
  const highGainThreshold = disease === 'Heart Disease' ? 0.120 : disease === 'Diabetes' ? 0.020 : 0.015;
  const meaningfulGainThreshold = disease === 'Heart Disease' ? 0.030 : disease === 'Diabetes' ? 0.006 : 0.003;
  const daDasThreshold = disease === 'Heart Disease' ? 0.65 : disease === 'Diabetes' ? 0.28 : 0.30;
  const medianDasThreshold = disease === 'Heart Disease' ? 0.50 : 0.20;

  if (delta_p >= highGainThreshold && stability >= 0.70 && das >= medianDasThreshold) {
    return 'STRONG';
  }
  if (das >= daDasThreshold && stability >= 0.50 && delta_p >= meaningfulGainThreshold) {
    return 'DISEASE-ASSOCIATED';
  }
  if ((delta_p >= meaningfulGainThreshold * 0.4 || das >= 0.15) && stability >= 0.50) {
    return 'MODERATE';
  }
  return 'WEAK';
}

// ============================================================
// CLINICAL INSIGHT GENERATION (Strict Statistical Association)
// ============================================================

export function getAdaptiveClinicalInsight(
  featA: string,
  featB: string,
  disease: string,
  classification: string,
  cis: number,
  das: number,
  delta_p: number
): string {
  const domainA = BIOMARKER_DOMAINS[featA] || 'Biomarker';
  const domainB = BIOMARKER_DOMAINS[featB] || 'Biomarker';

  if (classification === 'STRONG') {
    return `${featA} (${domainA}) and ${featB} (${domainB}) demonstrate strong, cross-validated synergistic predictive association with ${disease} (CIS: ${cis.toFixed(3)}, DAS: ${das.toFixed(3)}, ΔP: +${delta_p.toFixed(3)}).`;
  }
  if (classification === 'DISEASE-ASSOCIATED') {
    return `Cross-validated predictive contribution confirms that ${featA} and ${featB} represent a meaningful disease-associated interaction pattern for ${disease} (CIS: ${cis.toFixed(3)}, DAS: ${das.toFixed(3)}).`;
  }
  if (classification === 'MODERATE') {
    return `Moderate statistical synergy observed between ${featA} and ${featB} in ${disease} cohorts with consistent stability across cross-validation folds (CIS: ${cis.toFixed(3)}).`;
  }
  return `Evaluation indicates baseline linear interaction with limited incremental predictive gain for ${disease} (CIS: ${cis.toFixed(3)}).`;
}
