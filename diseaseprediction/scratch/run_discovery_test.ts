import { runPairwiseInteractionDiscovery } from '../src/utils/featureDiscoveryEngine';
import { generateMasterDataset } from '../src/data/defaultDataset';

console.log('Generating master dataset...');
const rawRows = generateMasterDataset();
console.log(`Generated ${rawRows.length} rows.`);

console.log('Running runPairwiseInteractionDiscovery...');
const result = runPairwiseInteractionDiscovery(rawRows);

console.log(`Total pairs in result: ${result.allPairs.length}`);

const cases = [
  { f1: 'BUN', f2: 'eGFR', d: 'CKD' },
  { f1: 'Serum_Creatinine', f2: 'eGFR', d: 'CKD' },
  { f1: 'HbA1c', f2: 'Fasting_Glucose', d: 'CKD' },
  { f1: 'Weight', f2: 'Waist_Circumference', d: 'CKD' },
  { f1: 'BMI', f2: 'Weight', d: 'CKD' },
  { f1: 'Age', f2: 'Sex', d: 'CKD' },
  { f1: 'Age', f2: 'Sex', d: 'Diabetes' },
  { f1: 'Age', f2: 'Sex', d: 'Heart Disease' },
];

for (const c of cases) {
  const match = result.allPairs.find(
    (p) =>
      p.disease === c.d &&
      ((p.featureA === c.f1 && p.featureB === c.f2) || (p.featureA === c.f2 && p.featureB === c.f1))
  );
  if (match) {
    console.log(`\n--- ${c.f1} x ${c.f2} (${c.d}) ---`);
    console.log(`  Discovery Rank: #${match.discoveryRank}`);
    console.log(`  Effective Rank: ${match.effectiveInteractionRank !== null ? '#' + match.effectiveInteractionRank : '—'}`);
    console.log(`  CIS: ${match.CIS}`);
    console.log(`  DAS: ${match.DAS} (margin: ${match.dasMargin})`);
    console.log(`  Incremental Gain: +${match.incrementalGain}`);
    console.log(`  Stability: ${match.stability}`);
    console.log(`  Correlation: ${match.corrRaw}`);
    console.log(`  Redundancy Status: ${match.redundancyStatus}`);
    console.log(`  Effective Score: ${match.effectiveInteractionScore}`);
    console.log(`  Final Tier: ${match.finalTier}`);
    console.log(`  Downstream Eligible: ${match.downstreamEligible}`);
    console.log(`  Classification Reason: ${match.classificationReason}`);
  }
}
