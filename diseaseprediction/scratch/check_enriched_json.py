import json

data = json.load(open('all_interactions_513.json'))
for d in data:
    if (d['feature_1'] == 'Age' and d['feature_2'] == 'Systolic_BP' and d['disease'] == 'HeartDisease') or \
       (d['feature_1'] == 'HbA1c' and d['feature_2'] == 'Fasting_Glucose' and d['disease'] == 'Diabetes'):
        print(f"=== {d['feature_1']} x {d['feature_2']} ({d['disease']}) ===")
        print(f"  AUC_A: {d['auc_a']:.6f}")
        print(f"  AUC_B: {d['auc_b']:.6f}")
        print(f"  Individual_Baseline_AUC: {d['individual_baseline_auc']:.6f}")
        print(f"  AUC_Additive: {d['auc_additive']:.6f}")
        print(f"  AUC_Interaction: {d['auc_interaction']:.6f}")
        print(f"  Pair_Gain: {d['pair_gain']:.6f}")
        print(f"  Interaction_Synergy: {d['interaction_synergy']:.6f}")
        print(f"  IPG: {d['ipg']:.6f}")
        print(f"  CIS: {d['cis']:.3f}")
        print(f"  DAS: {d['das']:.3f}")
        print(f"  Stability: {d['stability_score']:.2f}")
        print(f"  Classification: {d['classification']}")
