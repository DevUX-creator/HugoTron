import math

def srgb_to_lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def lin_to_srgb(c): return 12.92*c if c<=0.0031308 else 1.055*(c**(1/2.4))-0.055

def hex_to_rgb(h):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def rgb_to_oklab(r,g,b):
    r,g,b=srgb_to_lin(r),srgb_to_lin(g),srgb_to_lin(b)
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=l**(1/3),m**(1/3),s**(1/3)
    return (0.2104542553*l+0.7936177850*m-0.0040720468*s,
            1.9779984951*l-2.4285922050*m+0.4505937099*s,
            0.0259040371*l+0.7827717662*m-0.8086757660*s)

def oklab_to_rgb(L,a,bb):
    l=(L+0.3963377774*a+0.2158037573*bb)**3
    m=(L-0.1055613458*a-0.0638541728*bb)**3
    s=(L-0.0894841775*a-1.2914855480*bb)**3
    r= 4.0767416621*l-3.3077115913*m+0.2309699292*s
    g=-1.2684380046*l+2.6097574011*m-0.3413193965*s
    b=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    return tuple(min(1,max(0,lin_to_srgb(v))) for v in (r,g,b))

def oklch_to_hex(L,C,H):
    a=C*math.cos(math.radians(H)); b=C*math.sin(math.radians(H))
    r,g,bl=oklab_to_rgb(L,a,b)
    return '#%02x%02x%02x'%(round(r*255),round(g*255),round(bl*255))

def lch(hexv):
    L,a,b=rgb_to_oklab(*hex_to_rgb(hexv))
    return L, math.hypot(a,b), math.degrees(math.atan2(b,a))%360

def rellum(hexv):
    r,g,b=hex_to_rgb(hexv)
    return 0.2126*srgb_to_lin(r)+0.7152*srgb_to_lin(g)+0.0722*srgb_to_lin(b)

def contrast(f,b):
    a,c=rellum(f),rellum(b)
    hi,lo=max(a,c),min(a,c)
    return (hi+0.05)/(lo+0.05)

STEPS=[50,100,200,300,400,500,600,700,800,900]
# perceptual lightness targets
LT   =[0.97,0.93,0.87,0.79,0.70,0.61,0.52,0.43,0.34,0.24]

def ramp(name, anchor_hex, anchor_step, chroma_scale=1.0, hue_override=None):
    aL,aC,aH = lch(anchor_hex)
    H = hue_override if hue_override is not None else aH
    ai = STEPS.index(anchor_step)
    out={}
    for i,(st,L) in enumerate(zip(STEPS,LT)):
        if st==anchor_step:
            out[st]=anchor_hex; continue
        # chroma follows a bell around the anchor's lightness, scaled to anchor chroma
        f = 1 - abs(L-aL)*0.55
        C = max(0.0, aC*f*chroma_scale)
        out[st]=oklch_to_hex(L,C,H)
    return out, H

print("=== HUGO TRON PALETTE ===\n")
ramps={}
ramps['harbor'], h1 = ramp('harbor', '#00294d', 800)          # brand navy from the logo
ramps['saffron'], h2 = ramp('saffron', '#e3a11b', 400)        # the accent: their own saffron
ramps['clay'], h3   = ramp('clay',   '#b1795a', 500)          # warm counterweight
ramps['ink'], h4    = ramp('ink',    '#2b2926', 900, 0.35)    # warm neutral text
ramps['cream'], h5  = ramp('cream',  '#f7f4ef', 50, 0.5)      # the warm ground

for n,r in ramps.items():
    print(f"  /* {n} */")
    for st in STEPS: print(f"  --color-{n}-{st}: {r[st]};")
    print()

print("=== CONTRAST CHECKS (target: 4.5 normal text, 3.0 large) ===")
base=ramps['cream'][50]; surf=ramps['cream'][100]
checks=[
 ("fg-primary  ink-900   on cream-50", ramps['ink'][900], base, 4.5),
 ("fg-secondary ink-700  on cream-50", ramps['ink'][700], base, 4.5),
 ("fg-tertiary ink-600   on cream-50", ramps['ink'][600], base, 4.5),
 ("fg-tertiary ink-600   on cream-100", ramps['ink'][600], surf, 4.5),
 ("fg-heading  harbor-800 on cream-50", ramps['harbor'][800], base, 4.5),
 ("accent-strong clay-700 on cream-50", ramps['clay'][700], base, 4.5),
 ("saffron-700 on cream-50", ramps['saffron'][700], base, 4.5),
 ("cream-50 on harbor-900 (inverse)", base, ramps['harbor'][900], 4.5),
 ("harbor-200 on harbor-900 (inv sec)", ramps['harbor'][200], ramps['harbor'][900], 4.5),
 ("harbor-400 on harbor-900 (inv ter)", ramps['harbor'][400], ramps['harbor'][900], 4.5),
 ("ink-900 on saffron-400 (btn label)", ramps['ink'][900], ramps['saffron'][400], 4.5),
]
for label,f,b,t in checks:
    c=contrast(f,b); print(f"  {'PASS' if c>=t else 'FAIL'}  {c:5.2f}  {label}  ({f} on {b})")
