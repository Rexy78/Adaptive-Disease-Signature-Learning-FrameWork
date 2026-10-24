import { generateMasterDataset } from '../src/data/defaultDataset';
import { VALIDATED_19_FEATURES } from '../src/utils/featureDiscoveryEngine';

const dataset = generateMasterDataset();
const featureNames = VALIDATED_19_FEATURES.map((f) => f.name);

// 70% Train, 15% Val, 15% Test
const n = dataset.length;
const trainCount = Math.floor(n * 0.70); // 6477
const valCount = Math.floor(n * 0.15);   // 1388
const testCount = n - trainCount - valCount; // 1389

const trainData = dataset.slice(0, trainCount);
const valData = dataset.slice(trainCount, trainCount + valCount);
const testData = dataset.slice(trainCount + valCount);

console.log(`Train count: ${trainData.length}, Val count: ${valData.length}, Test count: ${testData.length}`);

// Simple logistic model for test verification
const diseases = ['Diabetes', 'Heart Disease', 'CKD'] as const;

diseases.forEach((disease) => {
  const targetCol = disease === 'Heart Disease' ? 'Heart_Disease' : disease;
  const trainPos = trainData.filter((r) => Number(r[targetCol]) === 1).length;
  const trainNeg = trainData.length - trainPos;
  const testPos = testData.filter((r) => Number(r[targetCol]) === 1).length;
  const testNeg = testData.length - testPos;

  const scalePosWeight = Math.round((trainNeg / trainPos) * 1000) / 1000;
  console.log(`\n=== ${disease} (Target: ${targetCol}) ===`);
  console.log(`Train Pos: ${trainPos}, Train Neg: ${trainNeg}, scale_pos_weight: ${scalePosWeight}`);
  console.log(`Test Pos: ${testPos}, Test Neg: ${testNeg}`);
});
