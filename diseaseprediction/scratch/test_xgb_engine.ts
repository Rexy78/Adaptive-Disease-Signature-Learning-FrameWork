import { generateMasterDataset } from '../src/data/defaultDataset';
import { runFeatureDiscovery } from '../src/utils/featureDiscoveryEngine';

const raw = generateMasterDataset();
console.log('Total Dataset Rows:', raw.length);
console.log('Columns:', Object.keys(raw[0]));

// Check disease target counts
let dmCount = 0;
let hdCount = 0;
let ckdCount = 0;

raw.forEach((r) => {
  if (Number(r.Diabetes) === 1) dmCount++;
  if (Number(r.Heart_Disease) === 1) hdCount++;
  if (Number(r.CKD) === 1) ckdCount++;
});

console.log(`Diabetes positive: ${dmCount} / ${raw.length} (${((dmCount / raw.length) * 100).toFixed(2)}%)`);
console.log(`Heart Disease positive: ${hdCount} / ${raw.length} (${((hdCount / raw.length) * 100).toFixed(2)}%)`);
console.log(`CKD positive: ${ckdCount} / ${raw.length} (${((ckdCount / raw.length) * 100).toFixed(2)}%)`);
