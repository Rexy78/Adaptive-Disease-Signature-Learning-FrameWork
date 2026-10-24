import { generateMasterDataset } from '../src/data/defaultDataset';
import { runPairwiseInteractionDiscovery } from '../src/utils/featureDiscoveryEngine';
import { runHierarchicalPatternLearning } from '../src/utils/patternLearningEngine';
import { runEvidenceDrivenHdpl } from '../src/utils/evidenceDrivenHdplEngine';
import { VALIDATED_19_FEATURES } from '../src/utils/featureDiscoveryEngine';

const raw = generateMasterDataset();
const discovery = runPairwiseInteractionDiscovery(raw);
const patternResult = runHierarchicalPatternLearning(discovery);
const hdplResult = runEvidenceDrivenHdpl(discovery, patternResult);

const featureNames = VALIDATED_19_FEATURES.map((f) => f.name);

const diseases: ('Diabetes' | 'Heart Disease' | 'CKD')[] = ['Diabetes', 'Heart Disease', 'CKD'];

const sigVectors: Record<string, { raw: number[]; norm: number[]; core: string[] }> = {};

diseases.forEach((disease) => {
  const primary = hdplResult.primaryPatterns[disease];
  const core = primary.coreFeatures.map((f) => f.featureName);
  
  // Build vector indexed by featureNames
  const rawVec = featureNames.map((fName) => {
    const item = primary.allRankedFeatures.find((rf) => rf.featureName === fName);
    return item ? item.normalizedHierarchicalContribution : 0.0;
  });

  const l2Norm = Math.sqrt(rawVec.reduce((sum, v) => sum + v * v, 0)) || 1.0;
  const normVec = rawVec.map((v) => Math.round((v / l2Norm) * 10000) / 10000);

  sigVectors[disease] = { raw: rawVec, norm: normVec, core };
});

console.log('--- HDPL SIGNATURE VECTORS ---');
diseases.forEach((d) => {
  console.log(d, 'Core:', sigVectors[d].core);
  console.log(d, 'Norm Vector:', sigVectors[d].norm);
});

// Compare Pairs
const pairs: Array<['Diabetes' | 'Heart Disease' | 'CKD', 'Diabetes' | 'Heart Disease' | 'CKD']> = [
  ['Diabetes', 'Heart Disease'],
  ['Diabetes', 'CKD'],
  ['Heart Disease', 'CKD'],
];

console.log('\n--- PAIRWISE COMPARISONS ---');
pairs.forEach(([dA, dB]) => {
  const vecA = sigVectors[dA].norm;
  const vecB = sigVectors[dB].norm;
  const coreA = sigVectors[dA].core;
  const coreB = sigVectors[dB].core;

  let dot = 0;
  let sumSq = 0;
  for (let i = 0; i < featureNames.length; i++) {
    dot += vecA[i] * vecB[i];
    const diff = vecA[i] - vecB[i];
    sumSq += diff * diff;
  }
  const cosSim = Math.round(dot * 10000) / 10000;
  const eucDist = Math.round(Math.sqrt(sumSq) * 10000) / 10000;

  const setA = new Set(coreA);
  const setB = new Set(coreB);
  const sharedCore = coreA.filter((f) => setB.has(f));
  const uniqueA = coreA.filter((f) => !setB.has(f));
  const uniqueB = coreB.filter((f) => !setA.has(f));
  const unionCount = new Set([...coreA, ...coreB]).size || 1;
  const jaccard = Math.round((sharedCore.length / unionCount) * 10000) / 10000;

  console.log(`${dA} <-> ${dB}:`);
  console.log(`  Cosine Similarity: ${cosSim}`);
  console.log(`  Euclidean Distance: ${eucDist}`);
  console.log(`  Core Jaccard Index: ${jaccard}`);
  console.log(`  Shared Core:`, sharedCore);
  console.log(`  ${dA} Unique:`, uniqueA);
  console.log(`  ${dB} Unique:`, uniqueB);
});
