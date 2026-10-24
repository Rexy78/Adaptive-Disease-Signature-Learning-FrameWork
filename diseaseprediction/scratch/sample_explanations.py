import json

with open('all_interactions_513.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

by_class = {}
for x in items:
    c = x.get('classification')
    if c not in by_class:
        by_class[c] = []
    if len(by_class[c]) < 3:
        by_class[c].append(x)

for c, pair_list in by_class.items():
    print(f"=== CLASSIFICATION: {c} (count in sample: {len(pair_list)}) ===")
    for p in pair_list:
        print(f"  {p['feature_1']} x {p['feature_2']} ({p['disease']}): CIS={p.get('cis')}, IPG={p.get('incremental_predictive_gain')}, DAS={p.get('das')}, Stab={p.get('stability_score')}")
        print(f"    explanation: {p.get('explanation')}")
