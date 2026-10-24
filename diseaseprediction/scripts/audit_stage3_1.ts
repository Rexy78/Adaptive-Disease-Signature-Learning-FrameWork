import { generateNhanesDataset } from '../src/data/nhanesData';
import { runPairwiseInteractionDiscovery } from '../src/utils/featureDiscoveryEngine';

const dataset = generateNhanesDataset();
console.log('Dataset loaded successfully with', dataset.length, 'records.');

const discoveryResult = runPairwiseInteractionDiscovery(dataset);

const diseases = ['Diabetes', 'Heart Disease', 'CKD'] as const;

let totalIntegrityErrors = 0;
let totalPairsAudited = 0;
let totalBoundsViolations = 0;

for (const dis of diseases) {
  const matrix = dis === 'Diabetes' 
    ? discoveryResult.diabetesMatrix 
    : dis === 'Heart Disease' 
    ? discoveryResult.heartDiseaseMatrix 
    : discoveryResult.ckdMatrix;

  console.log(`\n======================================================`);
  console.log(`AUDIT RESULTS FOR: ${dis.toUpperCase()} (${matrix.rankedPairs.length} pairs)`);
  console.log(`======================================================`);

  let prevIS = Infinity;
  let rankingValid = true;

  matrix.rankedPairs.forEach((p, idx) => {
    totalPairsAudited++;
    const wMI = 0.20 * p.mi;
    const wCorr = 0.15 * p.corr;
    const wCO = 0.20 * p.coOccurrence;
    const wFI = 0.20 * p.featureImportanceContrib;
    const wNID = 0.25 * p.nid;
    const exactSum = wMI + wCorr + wCO + wFI + wNID;
    
    // Check integrity against p.auditIntegrityCheckPassed
    if (!p.auditIntegrityCheckPassed) {
      totalIntegrityErrors++;
      console.error(`Audit check failed at rank #${p.rank} (${p.featureA} x ${p.featureB})`);
    }

    if (p.interactionScore > prevIS + 1e-6) {
      rankingValid = false;
    }
    prevIS = p.interactionScore;

    // Check bounds [0, 1]
    if (p.mi < 0 || p.mi > 1 || p.corr < 0 || p.corr > 1 || p.coOccurrence < 0 || p.coOccurrence > 1 || p.featureImportanceContrib < 0 || p.featureImportanceContrib > 1 || p.nid < 0 || p.nid > 1 || p.interactionScore < 0 || p.interactionScore > 1) {
      totalBoundsViolations++;
      console.error(`Out of bounds for pair ${p.featureA} x ${p.featureB}: IS=${p.interactionScore}, CO_norm=${p.coOccurrence}`);
    }
  });

  console.log(`Ranking strictly descending: ${rankingValid ? 'PASSED (TRUE)' : 'FAILED (FALSE)'}`);

  console.log(`\nAudit Table for Top 10 Pairs in ${dis}:`);
  console.log(`Rank | Pair | MI_norm | Corr_norm | Raw_CO_Ratio | CO_norm | FI_norm | NID_norm | Weighted_MI | Weighted_Corr | Weighted_CO | Weighted_FI | Weighted_NID | Final_IS`);
  console.log(`---|---|---|---|---|---|---|---|---|---|---|---|---|---`);
  matrix.rankedPairs.slice(0, 10).forEach((p) => {
    const wMI = (p.weightedMI ?? (0.20 * p.mi)).toFixed(4);
    const wCorr = (p.weightedCorr ?? (0.15 * p.corr)).toFixed(4);
    const wCO = (p.weightedCO ?? (0.20 * p.coOccurrence)).toFixed(4);
    const wFI = (p.weightedFI ?? (0.20 * p.featureImportanceContrib)).toFixed(4);
    const wNID = (p.weightedNID ?? (0.25 * p.nid)).toFixed(4);
    
    console.log(
      `#${p.rank} | ${p.featureA} × ${p.featureB} | ${p.mi.toFixed(3)} | ${p.corr.toFixed(3)} | ${p.rawCoOccurrenceRatio ?? p.coOccurrenceRaw}x | ${p.normalizedCoOccurrence ?? p.coOccurrence.toFixed(3)} | ${p.featureImportanceContrib.toFixed(3)} | ${p.nid.toFixed(3)} | ${wMI} | ${wCorr} | ${wCO} | ${wFI} | ${wNID} | ${p.interactionScore.toFixed(3)}`
    );
  });
}

console.log(`\n======================================================`);
console.log(`TOTAL PAIRS AUDITED: ${totalPairsAudited}`);
console.log(`TOTAL INTEGRITY ERRORS: ${totalIntegrityErrors}`);
console.log(`TOTAL BOUNDS VIOLATIONS: ${totalBoundsViolations}`);
console.log(`======================================================\n`);
