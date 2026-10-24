import json

with open('all_interactions_513.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

cases = [
    ('BUN', 'eGFR', 'CKD'),
    ('Serum_Creatinine', 'eGFR', 'CKD'),
    ('HbA1c', 'Fasting_Glucose', 'CKD'),
    ('Weight', 'Waist_Circumference', 'CKD'),
    ('BMI', 'Weight', 'CKD'),
    ('Age', 'Sex', 'CKD'),
    ('Age', 'Sex', 'Diabetes'),
    ('Age', 'Sex', 'HeartDisease'),
]

for f1, f2, d in cases:
    for x in items:
        if x.get('disease') == d and ((x.get('feature_1') == f1 and x.get('feature_2') == f2) or (x.get('feature_1') == f2 and x.get('feature_2') == f1)):
            print(f"{f1} x {f2} ({d}):")
            print(f"  rank={x.get('rank')}, cis={x.get('cis')}, das={x.get('das')}, ipg={x.get('incremental_predictive_gain')}, stab={x.get('stability_score')}")
            print(f"  corr={x.get('correlation')}, spearman_rho={x.get('spearman_rho')}, shap={x.get('xgb_interaction')}")
            print(f"  redundancy={x.get('redundancy')}, redundancy_status={x.get('redundancy_status')}, class={x.get('classification')}")
            print(f"  downstream_eligible={x.get('downstream_eligible')}")
            print(f"  explanation={x.get('explanation')}")
            print()
