import sys
sys.path.insert(0, 'python_engine')
from interaction_engine import ClinicalInteractionDiscoveryEngine
from fastapi_app import generate_benchmark_dataset
import pandas as pd
import numpy as np

df = generate_benchmark_dataset(1000)
print('Synthetic cohort generated:', df.shape)

engine = ClinicalInteractionDiscoveryEngine(imputation_method='median', n_splits=5, random_state=42)
X, Y_dict = engine.preprocess_dataset(df)

pairs_to_check = [('Age', 'Systolic_BP'), ('HbA1c', 'Fasting_Glucose')]
for f_i, f_j in pairs_to_check:
    print(f"\n=== Checking {f_i} x {f_j} ===")
    res = engine.compute_incremental_predictive_gains(X, Y_dict, [(f_i, f_j)])
    for tgt in Y_dict:
        m = res[tgt][(f_i, f_j)]
        print(f"Target: {tgt}")
        print(f"  AUC_A ({f_i}): {m['auc_model_a']:.6f}")
        print(f"  AUC_B ({f_j}): {m['auc_model_b']:.6f}")
        print(f"  auc_baseline: {m['auc_baseline']:.6f}")
        print(f"  auc_model_c (Interaction): {m['auc_model_c']:.6f}")
        print(f"  auc_gain: {m['auc_gain']:.6f}")
        print(f"  incremental_gain: {m['incremental_gain']:.6f}")
