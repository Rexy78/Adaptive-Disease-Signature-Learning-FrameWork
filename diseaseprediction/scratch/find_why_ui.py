for fn in ['src/components/Phase5InteractionNetwork.tsx', 'src/components/Module3InteractionDiscovery.tsx']:
    with open(fn, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"=== {fn} ===")
    for i, l in enumerate(lines):
        if any(k.lower() in l.lower() for k in ['classificationreason', 'downstreameligibilityreason', 'why', 'incremental contribution', 'p75', '≥ p75', '>= p75']):
            s = l.strip().encode('ascii', 'replace').decode('ascii')
            print(f"  {i+1}: {s[:110]}")
