exec(open('palette.py').read().split('print("=== HUGO TRON PALETTE ===')[0])
import json

STEPS=[50,100,200,300,400,500,600,700,800,900]
LT   =[0.965,0.925,0.865,0.785,0.700,0.612,0.525,0.437,0.358,0.250]

def build(hue, chromas, pins=None):
    """Explicit chroma per step — muted palettes need a profile, not a curve."""
    out={}
    for st,L,C in zip(STEPS,LT,chromas):
        out[st]=oklch_to_hex(L,C,hue)
    for st,hexv in (pins or {}).items(): out[st]=hexv
    return out

# Harbor — brand navy. Chroma peaks at the pinned logo colour and drops HARD at
# 900: a large dark field at C=0.10 reads heavy and dated (that was the old
# panel). The reference's big panel sits at C=0.022.
harbor = build(254.2,
    [0.008,0.014,0.024,0.036,0.050,0.065,0.082,0.098,0.110,0.030],
    pins={800:"#053c74"})

# Saffron — re-anchored from a high-key yellow to the DEEP RED of real saffron
# threads. Same role as the reference's brick shield: one warm accent, low-key
# enough to sit beside everything else.
saffron = build(35.0,
    [0.012,0.024,0.045,0.070,0.095,0.120,0.130,0.120,0.100,0.070])

# Sand — the muted greige/tan. Chips, quiet fills, the warm counterweight.
sand = build(89.2,
    [0.006,0.012,0.020,0.030,0.036,0.038,0.036,0.032,0.026,0.018])

# Ink — warm near-neutral. Body text, the banner ground.
ink = build(70.0,
    [0.003,0.004,0.005,0.006,0.007,0.008,0.008,0.008,0.007,0.006])

# Linen — the page ground. Warm greige, NOT near-white: at L=0.97 a page reads
# as unstyled default rather than as a chosen ground.
linen = build(101.5,
    [0.006,0.010,0.014,0.018,0.020,0.020,0.018,0.014,0.010,0.006])

ramps={"harbor":harbor,"saffron":saffron,"sand":sand,"ink":ink,"linen":linen}

# Nudge any small-text token that lands under 4.5:1 on the grounds it is used on.
def darken_until(ramp, step, hue, grounds, chroma):
    L=LT[STEPS.index(step)]
    for d in range(0,80):
        cand=oklch_to_hex(L-d*0.004, chroma, hue)
        if all(contrast(cand,g)>=4.5 for g in grounds): return cand,d
    return ramp[step],-1

base, surface = linen[100], linen[200]
ink[600],d1 = darken_until(ink,600,70.0,[base,surface],0.008)
saffron[600],d2 = darken_until(saffron,600,35.0,[base,surface],0.130)
print(f"ink-600 nudged {d1} steps -> {ink[600]}")
print(f"saffron-600 nudged {d2} steps -> {saffron[600]}")

for n,r in ramps.items():
    print(f"\n  /* {n} */")
    for st in STEPS: print(f"  --color-{n}-{st}: {r[st]};")

print("\n=== CONTRAST ===")
inv=harbor[900]
checks=[
 ("ink-900 on linen-100 (body)",ink[900],base),
 ("ink-700 on linen-100 (secondary)",ink[700],base),
 ("ink-600 on linen-100 (tertiary)",ink[600],base),
 ("ink-600 on linen-200 (tertiary/surface)",ink[600],surface),
 ("harbor-800 on linen-100 (headings)",harbor[800],base),
 ("harbor-800 on linen-200",harbor[800],surface),
 ("saffron-600 on linen-100 (accent text)",saffron[600],base),
 ("linen-50 on harbor-900 (inverse body)",linen[50],inv),
 ("harbor-200 on harbor-900 (inverse sec)",harbor[200],inv),
 ("harbor-300 on harbor-900 (inverse ter)",harbor[300],inv),
 ("sand-300 on harbor-900 (inverse eyebrow)",sand[300],inv),
 ("linen-50 on saffron-500 (primary btn)",linen[50],saffron[500]),
 ("linen-50 on ink-900 (btn hover)",linen[50],ink[900]),
 ("ink-900 on sand-300 (chip)",ink[900],sand[300]),
 ("linen-50 on ink-900 (banner)",linen[50],ink[900]),
]
ok=True
for l,f,b in checks:
    c=contrast(f,b); p=c>=4.5; ok&=p
    print(f"  {'PASS' if p else 'FAIL'} {c:5.2f}  {l}")
print("\nALL PASS" if ok else "\nSOME FAIL")
json.dump(ramps,open('ramps2.json','w'),indent=1)
