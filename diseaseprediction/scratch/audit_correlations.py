import json
import pandas as pd
import numpy as np
from scipy import stats

print("=== 1. CHECKING all_interactions_513.json ===")
with open('all_interactions_513.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for case in [('Weight', 'Waist_Circumference'), ('BMI', 'Weight'), ('BUN', 'eGFR'), ('Serum_Creatinine', 'eGFR'), ('HbA1c', 'Fasting_Glucose')]:
    for x in items:
        if x.get('disease') == 'CKD' and ((x.get('feature_1') == case[0] and x.get('feature_2') == case[1]) or (x.get('feature_1') == case[1] and x.get('feature_2') == case[0])):
            print(f"JSON CKD {case[0]} x {case[1]}:")
            print(f"  correlation: {x.get('correlation')}")
            print(f"  spearman_rho: {x.get('spearman_rho')}")
            print(f"  corr_score: {x.get('corr_score')}")
            print(f"  redundancy: {x.get('redundancy')}")
            print(f"  redundancy_status: {x.get('redundancy_status')}")
            print(f"  classification: {x.get('classification')}")
            print(f"  ipg: {x.get('incremental_predictive_gain')}")
            print(f"  shap: {x.get('xgb_interaction')}")

print("\n=== 2. CHECKING master_dataset_labeled.csv ===")
try:
    df_master = pd.read_csv(r'c:\Users\THARSHIKA\Downloads\master_dataset_labeled.csv')
    print("Master dataset columns:", df_master.columns.tolist()[:10])
    for f1, f2 in [('Weight', 'Waist_Circumference'), ('BMI', 'Weight'), ('BUN', 'eGFR'), ('Serum_Creatinine', 'eGFR'), ('HbA1c', 'Fasting_Glucose')]:
        # normalize column names
        c1 = [c for c in df_master.columns if c.lower().replace('_', '') == f1.lower().replace('_', '')]
        c2 = [c for c in df_master.columns if c.lower().replace('_', '') == f2.lower().replace('_', '')]
        if c1 and c2:
            v1 = df_master[c1[0]].dropna()
            v2 = df_master[c2[0]].dropna()
            idx = df_master[[c1[0], c2[0]]].dropna().index
            rho, pval = stats.spearmanr(df_master.loc[idx, c1[0]], df_master.loc[idx, c2[0]])
            r_pearson, _ = stats.pearsonr(df_master.loc[idx, c1[0]], df_master.loc[idx, c2[0]])
            print(f"Master {f1} x {f2}: Spearman rho = {rho:.6f}, Pearson r = {r_pearson:.6f}")
except Exception as e:
    print("Master dataset error:", e)

print("\n=== 3. CHECKING NHANES_Heart_Diabetes_CKD_Final.csv ===")
try:
    df_nhanes = pd.read_csv(r'c:\Users\THARSHIKA\Downloads\NHANES_Heart_Diabetes_CKD_Final.csv')
    for f1, f2 in [('Weight', 'Waist_Circumference'), ('BMI', 'Weight'), ('BUN', 'eGFR'), ('Serum_Creatinine', 'eGFR'), ('HbA1c', 'Fasting_Glucose')]:
        c1 = [c for c in df_nhanes.columns if c.lower().replace('_', '') == f1.lower().replace('_', '')]
        c2 = [c for c in df_nhanes.columns if c.lower().replace('_', '') == f2.lower().replace('_', '')]
        if c1 and c2:
            idx = df_nhanes[[c1[0], c2[0]]].dropna().index
            rho, _ = stats.spearmanr(df_nhanes.loc[idx, c1[0]], df_nhanes.loc[idx, c2[0]])
            r_pearson, _ = stats.pearsonr(df_nhanes.loc[idx, c1[0]], df_nhanes.loc[idx, c2[0]])
            print(f"NHANES {f1} x {f2}: Spearman rho = {rho:.6f}, Pearson r = {r_pearson:.6f}")
except Exception as e:
    print("NHANES error:", e)
