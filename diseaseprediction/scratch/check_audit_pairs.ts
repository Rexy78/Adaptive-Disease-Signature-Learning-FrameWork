import { runPairwiseInteractionDiscovery } from '../src/utils/featureDiscoveryEngine';
import { generateMasterDataset } from '../src/data/defaultDataset';

console.log('Generating master dataset...');
const rawRows = generateMasterDataset();
console.log(`Generated ${rawRows.length} rows. Running discovery...`);
const result = runPairwiseInteractionDiscovery(rawRows);

const cases = [
  { f1: 'Age', f2: 'Systolic_BP', d: 'Heart Disease' },
  { f1: 'HbA1c', f2: 'Fasting_Glucose', d: 'Diabetes' },
];

for (const c of cases) {
  const p = result.allPairs.find(
    (x) =>
      x.disease === c.d &&
      ((x.featureA === c.f1 && x.featureB === c.f2) ||
        (x.featureA === c.f2 && x.featureB === c.f1))
  );
  console.log(`\n=== ${c.f1} x ${c.f2} (${c.d}) ===`);
  if (p) {
    console.log(JSON.stringify({
      pairId: p.pairId,
      disease: p.disease,
      CIS: p.CIS,
      DAS: p.DAS,
      dasMargin: p.dasMargin,
      stability: p.stability,
      incrementalGain: p.incrementalGain,
      IPG: p.IPG,
      synergyAUC: p.synergyAUC,
      corrRaw: p.corrRaw,
      finalTier: p.finalTier,
      redundancyStatus: p.redundancyStatus,
      downstreamEligible: p.downstreamEligible,
      classificationReason: p.classificationReason,
      validationReport: p.validationReport
    }, null, 2));
  } else {
    console.log('NOT FOUND');
  }
}
