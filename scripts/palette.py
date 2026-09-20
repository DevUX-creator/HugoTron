exec(open('palette.py').read().split('print("=== HUGO TRON PALETTE ===')[0])
import json
STEPS=[50,100,200,300,400,500,600,700,800,900]
LT   =[0.975,0.945,0.895,0.820,0.740,0.650,0.560,0.470,0.385,0.275]

def build(hue, chromas, pins=None):
    out={st:oklch_to_hex(L,C,hue) for st,L,C in zip(STEPS,LT,chromas)}
    for st,h in (pins or {}).items(): out[st]=h
    return out

# Harbor — the brand blue, now SATURATED rather than muted. Big panels use the
# brand colour itself, the way Birkenstock's do.
harbor = build(259.0,
    [0.010,0.022,0.045,0.075,0.105,0.135,0.150,0.150,0.120,0.080],
    pins={800:"#053c74"})

# Lime — the flashy accent from the reference. Very light and very chromatic:
# it is a SURFACE colour that carries dark ink, never text on white.
lime = build(118.0,
    [0.040,0.070,0.110,0.150,0.175,0.165,0.150,0.130,0.105,0.070])

# Taupe — the warm neutral counterweight.
taupe = build(75.0,
    [0.006,0.010,0.016,0.022,0.026,0.026,0.024,0.020,0.016,0.010])

# Ink — near-neutral, cool-leaning to sit beside the blue.
ink = build(260.0,
    [0.003,0.005,0.008,0.010,0.012,0.012,0.012,0.012,0.010,0.008])

# Paper — the ground. White-based and clean, the way both references are.
paper = build(90.0,
    [0.002,0.004,0.007,0.010,0.012,0.012,0.010,0.008,0.006,0.004],
    pins={50:"#ffffff"})

ramps={"harbor":harbor,"lime":lime,"taupe":taupe,"ink":ink,"paper":paper}

base, surface, muted, inv = paper[50], paper[100], paper[200], harbor[800]

def fix(ramp,step,hue,chroma,grounds):
    L=LT[STEPS.index(step)]
    for d in range(0,90):
        c=oklch_to_hex(L-d*0.004,chroma,hue)
        if all(contrast(c,g)>=4.5 for g in grounds): return c
    return ramp[step]

ink[600]=fix(ink,600,260.0,0.012,[base,surface])
harbor[600]=fix(harbor,600,259.0,0.150,[base,surface])

for n,r in ramps.items():
    print(f"\n  /* {n} */")
    for st in STEPS: print(f"  --color-{n}-{st}: {r[st]};")

print(f"\nbg-base={base} bg-surface={surface} bg-muted={muted} bg-inverse={inv}")
print("\n=== CONTRAST ===")
checks=[
 ("ink-900 / base (body)",ink[900],base),("ink-900 / surface",ink[900],surface),
 ("ink-700 / base (secondary)",ink[700],base),("ink-600 / base (tertiary)",ink[600],base),
 ("ink-600 / surface",ink[600],surface),
 ("harbor-800 / base (headings)",harbor[800],base),("harbor-800 / surface",harbor[800],surface),
 ("harbor-600 / base (accent text)",harbor[600],base),
 ("paper-50 / harbor-800 (inverse body)",paper[50],inv),
 ("harbor-100 / harbor-800 (inverse sec)",harbor[100],inv),
 ("harbor-200 / harbor-800 (inverse ter)",harbor[200],inv),
 ("lime-300 / harbor-800 (inverse eyebrow)",lime[300],inv),
 ("ink-900 / lime-300 (primary btn)",ink[900],lime[300]),
 ("ink-900 / lime-400",ink[900],lime[400]),
 ("paper-50 / ink-900 (banner)",paper[50],ink[900]),
 ("ink-900 / taupe-300 (chip)",ink[900],taupe[300]),
]
ok=True
for l,f,b in checks:
    c=contrast(f,b); p=c>=4.5; ok&=p
    print(f"  {'PASS' if p else 'FAIL'} {c:5.2f}  {l}  ({f} on {b})")
print("\nALL PASS" if ok else "\nSOME FAIL")
json.dump(ramps,open('ramps3.json','w'),indent=1)
