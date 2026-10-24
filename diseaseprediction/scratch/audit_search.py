import json

with open('all_interactions_513.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

targets = ['0.713', '0.535', '0.404', '0.393', '0.266', '0.251']
print(f"Total items in all_interactions_513.json: {len(items)}")

for idx, x in enumerate(items):
    s = json.dumps(x)
    for t in targets:
        if t in s:
            print(f"Found {t} in idx {idx}: pair_id={x.get('pair_id')}, disease={x.get('disease')}, cis={x.get('cis')}, das={x.get('das')}, ipg={x.get('incremental_predictive_gain')}, stab={x.get('stability_score')}, red={x.get('redundancy')}, red_status={x.get('redundancy_status')}, class={x.get('classification')}")
