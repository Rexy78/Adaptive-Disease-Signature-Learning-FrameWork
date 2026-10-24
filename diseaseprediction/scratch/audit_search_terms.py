import os
import re

search_terms = ['ipg', 'incremental_gain', 'auc_gain', 'synergy', 'pair_gain', 'interaction_auc', 'additive_auc', 'baseline_auc', 'collineargainthreshold', 'redundancy']
results = {}

for root, dirs, files in os.walk('.'):
    if any(ign in root for ign in ['node_modules', '.git', 'dist', '.gemini']):
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx', '.py', '.json', '.js', '.cjs')):
            if f in ['all_interactions_513.json', 'package-lock.json', 'bun.lock']:
                continue
            path = os.path.join(root, f)
            try:
                content = open(path, 'r', encoding='utf-8', errors='ignore').read()
                matches = []
                for term in search_terms:
                    pattern = re.compile(rf'\b{term}\b', re.IGNORECASE)
                    found = pattern.findall(content)
                    if found:
                        matches.append(f"{term} ({len(found)})")
                if matches:
                    results[path] = matches
            except Exception as e:
                pass

for path, m in sorted(results.items()):
    print(f"{path}: {', '.join(m)}")
