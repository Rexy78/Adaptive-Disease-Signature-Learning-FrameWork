import re

for fn in ['src/utils/featureDiscoveryEngine.ts', 'src/components/Phase5InteractionNetwork.tsx']:
    with open(fn, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"=== {fn} ===")
    for i, l in enumerate(lines):
        if 'p75' in l.lower() or '≥' in l or '>=' in l:
            if any(term in l.lower() for term in ['das', 'reason', 'why', 'explanation', 'criteria']):
                s = l.strip().encode('ascii', 'replace').decode('ascii')
                print(f"  {i+1}: {s}")
