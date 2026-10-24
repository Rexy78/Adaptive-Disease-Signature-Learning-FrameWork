import os, re

phrases = [
    'p75',
    '≥ p75',
    '>= p75',
    'High incremental contribution',
    'high incremental predictive gain',
    'High incremental predictive gain',
    'Small measurable incremental contribution',
    'classificationReason',
    'explanation',
    'effectiveRank',
    'effectiveInteractionRank',
]

for root, dirs, files in os.walk('.'):
    if any(p in root for p in ['node_modules', '.git', '.system_generated']):
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx', '.py', '.json')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                txt = fp.read()
                for ph in phrases:
                    if ph in txt:
                        # find line numbers
                        for idx, line in enumerate(txt.splitlines()):
                            if ph in line:
                                print(f"{p}:{idx+1}: {line.strip()[:110]}")
