"""
Deterministic validation script testing:
- Test Case A: Additive without interaction (AUC_A=0.70, AUC_B=0.65, AUC_Add=0.75, AUC_Int=0.75)
- Test Case B: Genuine interaction (AUC_A=0.70, AUC_B=0.65, AUC_Add=0.75, AUC_Int=0.81)
- Test Case C: Interaction degrades additive (AUC_A=0.72, AUC_B=0.68, AUC_Add=0.79, AUC_Int=0.77)
- Real Audit Case 1: Age x Systolic_BP on Heart Disease
- Real Audit Case 2: HbA1c x Fasting_Glucose on Diabetes
- Cohort Verification across all 513 records in all_interactions_513.json
"""

import json
import sys

def compute_metrics(auc_a, auc_b, auc_add, auc_int):
    baseline = max(auc_a, auc_b)
    pair_gain = max(0.0, auc_add - baseline)
    interaction_synergy = max(0.0, auc_int - auc_add)
    ipg = interaction_synergy
    return {
        "individual_baseline_auc": round(baseline, 4),
        "pair_gain": round(pair_gain, 4),
        "interaction_synergy": round(interaction_synergy, 4),
        "ipg": round(ipg, 4)
    }

def run_tests():
    print("=== RUNNING DETERMINISTIC TESTS ===")
    
    # Test A
    res_a = compute_metrics(0.70, 0.65, 0.75, 0.75)
    print(f"Test A (Additive Only): {res_a}")
    assert res_a["individual_baseline_auc"] == 0.70
    assert res_a["pair_gain"] == 0.05
    assert res_a["interaction_synergy"] == 0.0
    assert res_a["ipg"] == 0.0
    print("Test A PASSED")

    # Test B
    res_b = compute_metrics(0.70, 0.65, 0.75, 0.81)
    print(f"Test B (Genuine Interaction): {res_b}")
    assert res_b["individual_baseline_auc"] == 0.70
    assert res_b["pair_gain"] == 0.05
    assert res_b["interaction_synergy"] == 0.06
    assert res_b["ipg"] == 0.06
    print("Test B PASSED")

    # Test C
    res_c = compute_metrics(0.72, 0.68, 0.79, 0.77)
    print(f"Test C (Degrading Interaction): {res_c}")
    assert res_c["individual_baseline_auc"] == 0.72
    assert res_c["pair_gain"] == 0.07
    assert res_c["interaction_synergy"] == 0.0
    assert res_c["ipg"] == 0.0
    print("Test C PASSED")

    # Verify all_interactions_513.json
    print("\n=== VERIFYING all_interactions_513.json (513 records) ===")
    with open("all_interactions_513.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert len(data) == 513, f"Expected 513 records, got {len(data)}"
    
    required_fields = [
        "auc_a", "auc_b", "individual_baseline_auc",
        "auc_additive", "auc_interaction",
        "pair_gain", "interaction_synergy", "ipg",
        "AUC_A", "AUC_B", "Individual_Baseline_AUC",
        "AUC_Additive", "AUC_Interaction",
        "Pair_Gain", "Interaction_Synergy", "IPG"
    ]
    
    for i, rec in enumerate(data):
        for field in required_fields:
            assert field in rec, f"Missing {field} in record {i}: {rec.get('feature_a')} x {rec.get('feature_b')} ({rec.get('disease')})"
            val = rec[field]
            assert isinstance(val, (int, float)), f"Non-numeric {field} in record {i}: {val}"
            assert not (val != val), f"NaN in {field} in record {i}"
        
        # Verify mathematical consistency
        expected_base = max(rec["auc_a"], rec["auc_b"])
        assert abs(rec["individual_baseline_auc"] - expected_base) < 1e-4, f"Baseline mismatch in record {i}"
        
        expected_pair_gain = max(0.0, rec["auc_additive"] - expected_base)
        assert abs(rec["pair_gain"] - expected_pair_gain) < 1e-4, f"Pair gain mismatch in record {i}"
        
        expected_synergy = max(0.0, rec["auc_interaction"] - rec["auc_additive"])
        assert abs(rec["interaction_synergy"] - expected_synergy) < 1e-4, f"Synergy mismatch in record {i}"
        assert abs(rec["ipg"] - expected_synergy) < 1e-4, f"IPG != Synergy in record {i}"
        assert abs(rec["IPG"] - rec["ipg"]) < 1e-4, f"IPG alias mismatch in record {i}"

    print(f"All 513 records verified with exact mathematical consistency!")

    # Check Real Audit Cases
    print("\n=== VERIFYING REAL AUDIT CASES ===")
    
    # Case 1: Age x Systolic_BP for Heart Disease
    c1 = [r for r in data if r.get("disease") in ["Heart Disease", "HeartDisease"] and 
          {r.get("feature_1") or r.get("feature_a"), r.get("feature_2") or r.get("feature_b")} == {"Age", "Systolic_BP"}]
    assert len(c1) == 1, f"Expected 1 record for Age x Systolic_BP, got {len(c1)}"
    r1 = c1[0]
    print(f"Case 1: Age x Systolic_BP (Heart Disease)")
    print(f"  AUC_A: {r1['auc_a']:.4f}, AUC_B: {r1['auc_b']:.4f}")
    print(f"  Individual Baseline AUC: {r1['individual_baseline_auc']:.4f}")
    print(f"  Additive Pair AUC: {r1['auc_additive']:.4f}")
    print(f"  Interaction AUC: {r1['auc_interaction']:.4f}")
    print(f"  Pair Gain: {r1['pair_gain']:.4f}")
    print(f"  Interaction Synergy: {r1['interaction_synergy']:.4f}")
    print(f"  IPG: {r1['ipg']:.4f}")

    # Case 2: HbA1c x Fasting_Glucose for Diabetes
    c2 = [r for r in data if r.get("disease") == "Diabetes" and 
          {r.get("feature_1") or r.get("feature_a"), r.get("feature_2") or r.get("feature_b")} == {"HbA1c", "Fasting_Glucose"}]
    assert len(c2) == 1, f"Expected 1 record for HbA1c x Fasting_Glucose, got {len(c2)}"
    r2 = c2[0]
    print(f"\nCase 2: HbA1c x Fasting_Glucose (Diabetes)")
    print(f"  AUC_A: {r2['auc_a']:.4f}, AUC_B: {r2['auc_b']:.4f}")
    print(f"  Individual Baseline AUC: {r2['individual_baseline_auc']:.4f}")
    print(f"  Additive Pair AUC: {r2['auc_additive']:.4f}")
    print(f"  Interaction AUC: {r2['auc_interaction']:.4f}")
    print(f"  Pair Gain: {r2['pair_gain']:.4f}")
    print(f"  Interaction Synergy: {r2['interaction_synergy']:.4f}")
    print(f"  IPG: {r2['ipg']:.4f}")
    print(f"  Spearman |r|: {r2.get('spearman', r2.get('correlation', 0)):.4f}")
    print(f"  SHAP: {r2.get('shap_interaction_weight', r2.get('shap_interaction', 0)):.4f}")
    print(f"  Final Tier: {r2.get('final_tier', r2.get('status'))}")

    print("\nALL DETERMINISTIC AND AUDIT CASE TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
