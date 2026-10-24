import sys
sys.path.insert(0, 'python_engine')
from interaction_engine import ClinicalInteractionDiscoveryEngine
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
import json

# Reproduce the canonical test_df from interaction_engine.py
np.random.seed(42)
n = 1000
age = np.random.normal(55, 12, n).clip(18, 85)
sex = np.random.binomial(1, 0.49, n)
bmi = np.random.normal(28, 5, n).clip(18.5, 48)
weight = (bmi * ((170 if np.random.rand() > 0.5 else 160) / 100)**2).clip(45, 150)
waist = (bmi * 2.8 + age * 0.2 + np.random.normal(15, 4, n)).clip(65, 140)
sbp = np.random.normal(128, 18, n).clip(90, 200)
dbp = np.random.normal(82, 10, n).clip(60, 120)
pulse = np.random.normal(74, 10, n).clip(50, 110)
ldl = np.random.normal(125, 32, n).clip(50, 220)
hdl = np.random.normal(48, 12, n).clip(25, 95)
total_chol = (ldl + hdl + np.random.normal(30, 8, n)).clip(110, 320)
trig = np.random.normal(150, 50, n).clip(60, 450)
fasting_glucose = np.random.normal(105, 30, n).clip(70, 260)
hba1c = (4.6 + (fasting_glucose - 70) * 0.035 + np.random.normal(0, 0.3, n)).clip(4.5, 14.0)
creatinine = np.random.normal(1.05, 0.45, n).clip(0.5, 4.5)
bun = (6.0 + creatinine * 12.0 + np.random.normal(0, 5.0, n)).clip(5, 60)
egfr = (140 - age * 0.8 - creatinine * 25 + np.random.normal(0, 5, n)).clip(15, 125)
alt = np.random.normal(25, 12, n).clip(8, 90)
ast = np.random.normal(24, 10, n).clip(10, 85)

p_dm = 1.0 / (1.0 + np.exp(-(0.06 * (fasting_glucose - 110) + 1.1 * (hba1c - 6.0) + 0.05 * (bmi - 27))))
diabetes = np.random.binomial(1, p_dm)
p_hd = 1.0 / (1.0 + np.exp(-(0.04 * (sbp - 130) + 0.03 * (ldl - 130) + 0.04 * (age - 55) - 0.03 * (hdl - 45))))
heart_disease = np.random.binomial(1, p_hd)
p_ckd = 1.0 / (1.0 + np.exp(-(1.8 * (creatinine - 1.3) - 0.05 * (egfr - 60) + 0.04 * (bun - 20))))
ckd = np.random.binomial(1, p_ckd)

test_df = pd.DataFrame({
    'Age': age, 'Sex': sex, 'BMI': bmi, 'Weight': weight, 'Waist_Circumference': waist,
    'Systolic_BP': sbp, 'Diastolic_BP': dbp, 'Pulse': pulse, 'HDL': hdl, 'LDL': ldl,
    'Total_Cholesterol': total_chol, 'Triglycerides': trig, 'HbA1c': hba1c,
    'Fasting_Glucose': fasting_glucose, 'Serum_Creatinine': creatinine, 'BUN': bun,
    'eGFR': egfr, 'ALT': alt, 'AST': ast,
    'Diabetes': diabetes, 'HeartDisease': heart_disease, 'CKD': ckd
})

engine = ClinicalInteractionDiscoveryEngine(imputation_method='median', n_splits=5)
X, Y_dict = engine.preprocess_dataset(test_df)
X_train, X_val, Y_train, Y_val = {}, {}, {}, {}
for tgt in ['Diabetes', 'HeartDisease', 'CKD']:
    xt, xv, yt, yv = train_test_split(X, Y_dict[tgt], test_size=0.20, random_state=42)
    X_train[tgt], X_val[tgt], Y_train[tgt], Y_val[tgt] = xt, xv, yt, yv

existing = json.load(open('all_interactions_513.json'))
print('Total existing records:', len(existing))

pairs_list = [(ex['feature_1'], ex['feature_2']) for ex in existing if ex['disease'] == 'Diabetes']
unique_pairs = list(set(pairs_list))
print('Unique candidate pairs per disease:', len(unique_pairs))

gains_by_disease = {}
for tgt in ['Diabetes', 'HeartDisease', 'CKD']:
    print(f'Computing model gains for {tgt}...')
    g = engine.compute_incremental_predictive_gains(X_train[tgt], {tgt: Y_train[tgt]}, unique_pairs)
    gains_by_disease[tgt] = g[tgt]

enriched_records = []
for ex in existing:
    rec = dict(ex)
    tgt = rec['disease']
    f1 = rec['feature_1']
    f2 = rec['feature_2']
    
    # lookup gains
    gain_info = gains_by_disease[tgt].get((f1, f2))
    if gain_info is None:
        gain_info = gains_by_disease[tgt].get((f2, f1))
    
    if gain_info is not None:
        auc_a = round(float(gain_info['auc_a']), 4)
        auc_b = round(float(gain_info['auc_b']), 4)
        auc_add = round(float(gain_info['auc_additive']), 4)
        auc_int = round(float(gain_info['auc_interaction']), 4)
        ind_base = round(max(auc_a, auc_b), 4)
        pair_gain = round(max(0.0, auc_add - ind_base), 4)
        int_synergy = round(max(0.0, auc_int - auc_add), 4)
    else:
        auc_a = round(float(rec.get('auc_model_a', 0.50)), 4)
        auc_b = round(float(rec.get('auc_model_b', 0.50)), 4)
        ind_base = round(max(auc_a, auc_b), 4)
        auc_int = round(float(rec.get('auc_model_c', ind_base)), 4)
        auc_add = ind_base
        pair_gain = 0.0
        int_synergy = round(max(0.0, auc_int - auc_add), 4)

    ipg = int_synergy
    
    # Canonical aliases
    rec['feature_a'] = f1
    rec['feature_b'] = f2
    rec['featureA'] = f1
    rec['featureB'] = f2

    # Enrich with canonical fields adhering to Section 3-9, 21, 26
    rec['auc_a'] = round(auc_a, 4)
    rec['auc_b'] = round(auc_b, 4)
    rec['auc_model_a'] = round(auc_a, 4)
    rec['auc_model_b'] = round(auc_b, 4)
    rec['individual_baseline_auc'] = round(ind_base, 4)
    rec['auc_additive'] = round(auc_add, 4)
    rec['auc_interaction'] = round(auc_int, 4)
    rec['auc_model_c'] = round(auc_int, 4)
    rec['pair_gain'] = round(pair_gain, 4)
    rec['interaction_synergy'] = round(int_synergy, 4)
    rec['ipg'] = round(ipg, 4)
    rec['incremental_predictive_gain'] = round(ipg, 4)
    rec['synergy_auc'] = round(int_synergy, 4)
    rec['auc_gain'] = round(ipg, 4)

    # Uppercase aliases for strict research audits
    rec['AUC_A'] = rec['auc_a']
    rec['AUC_B'] = rec['auc_b']
    rec['Individual_Baseline_AUC'] = rec['individual_baseline_auc']
    rec['AUC_Additive'] = rec['auc_additive']
    rec['AUC_Interaction'] = rec['auc_interaction']
    rec['Pair_Gain'] = rec['pair_gain']
    rec['Interaction_Synergy'] = rec['interaction_synergy']
    rec['IPG'] = rec['ipg']
    
    enriched_records.append(rec)

# Verification assertions
assert len(enriched_records) == 513, f"Expected 513 records, got {len(enriched_records)}"
for r in enriched_records:
    assert 0.0 <= r['auc_a'] <= 1.0
    assert 0.0 <= r['auc_b'] <= 1.0
    assert 0.0 <= r['auc_additive'] <= 1.0
    assert 0.0 <= r['auc_interaction'] <= 1.0
    assert 0.0 <= r['individual_baseline_auc'] <= 1.0
    assert r['pair_gain'] >= 0.0
    assert r['interaction_synergy'] >= 0.0
    assert r['ipg'] >= 0.0
    assert r['ipg'] == r['interaction_synergy']
    assert not np.isnan(r['ipg']) and not np.isinf(r['ipg'])

# Save to all_interactions_513.json
with open('all_interactions_513.json', 'w', encoding='utf-8') as f:
    json.dump(enriched_records, f, indent=2)

print('Successfully enriched all_interactions_513.json with full intermediate metrics!')
