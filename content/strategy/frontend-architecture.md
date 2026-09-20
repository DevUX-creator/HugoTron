# Frontend Architecture & Handover Design

**Scope:** We build the frontend. The client's team wires up backend, payments and data.
**Therefore the primary design goal is not the UI — it is the seam.**

_(Written in English: this is the document the client's developers will read.
Client-facing content and copy stay German — see `content/pages/`, `content/strategy/homepage-struktur.md`.)_

---

## 1. The governing principle

> A beautiful frontend with data fetching tangled through its components is **worse**
> than a plain one with clean seams — because the client's team has to unpick it,
> and every hour they spend unpicking is an hour they blame on us.

So the architecture is organised around one rule:

**No component ever knows where data comes from.**

Every page and component imports from a typed data layer. That layer ships with a mock
adapter reading local JSON (seeded from the real scraped content). The client's team
replaces **one folder** and changes **one env var**. Nothing in `app/` or `components/`
is touched.

Everything below exists to make that true.

---

## 2. Stack

| Concern    | Choice                                          | Why this one                                                                                                                                  |
| ---------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 15, App Router, TypeScript (strict)** | SEO is the whole game here (see `audit.md`); Server Components make the data seam clean — swapping mock→real API needs zero component changes |
| Styling    | **Tailwind CSS v4**                             | No build config to hand over, no CSS naming conventions for another team to learn                                                             |
| Components | **shadcn/ui** (Radix primitives)                | Copied into the repo, not a dependency. Client's team owns and edits them. Accessibility handled by Radix.                                    |
| i18n       | **next-intl**                                   | Locale-prefixed routes (`/de`, `/en`), typed message keys, works with Server Components                                                       |
| Contracts  | **Zod**                                         | Single source of truth: TS types + runtime validation + exportable JSON Schema for a non-TS backend                                           |
| Forms      | **react-hook-form + @hookform/resolvers/zod**   | Same schema validates client and server                                                                                                       |
| Cart       | **Zustand** + `persist`                         | ~1 kB, no provider nesting, localStorage out of the box                                                                                       |
| Images     | **next/image**                                  | Seeded with the Wix CDN URLs from the scrape; swap to their CDN later                                                                         |
| Deploy     | **Vercel preview deploys**                      | Client clicks a link and sees progress. Worth more than any status report.                                                                    |

### Why not Astro

Leaner for a pure content site and genuinely tempting given 80% of this is content.
Rejected because: the cart needs real interactivity, and the client's team is far more
likely to be able to pick up Next than Astro. **Handover risk outweighs the bundle win.**

### What we deliberately do NOT build

Not our scope, and building it would create work the client has to undo:

- No database, no ORM, no migrations
- No payment integration — we build the checkout **UI** and stop at a stub call
- No auth — login/account UI only, behind a stubbed session interface
- No CMS choice — we define the content contract; they pick the CMS
- No email sending — form submits hit a stub

---

## 3. Folder structure

```
src/
  app/
    [locale]/
      (marketing)/          # home, über uns, großhandel, private label
      sortiment/            # category + product detail
      warenkorb/            # cart
      checkout/             # checkout shell (stub)
      anfrage/              # B2B enquiry
    api/                    # stub route handlers, clearly marked
  components/
    ui/                     # shadcn primitives
    layout/                 # header, footer, nav
  features/
    product/                # ProductCard, ProductDetail, VariantPicker, PriceDisplay
    cart/                   # CartDrawer, CartLine, CartSummary
    enquiry/                # EnquiryForm, SampleRequestForm
    content/                # Hero, TrustBar, AudienceSplit, FAQ, ...
  lib/
    contracts/         ← THE HANDOVER ARTIFACT
      product.ts
      category.ts
      page.ts
      enquiry.ts
      order.ts
      index.ts
    data/              ← THE SEAM
      index.ts              # picks adapter from env
      adapters/
        mock/               # ships with the prototype, reads /seed
        api/                # empty stubs + TODOs — client fills these in
    actions/           ← ALL MUTATIONS, one file each
      submit-enquiry.ts
      create-checkout.ts
      subscribe-newsletter.ts
  i18n/
    messages/{de,en}.json
seed/
  products.de.json  products.en.json
  pages.de.json     pages.en.json
INTEGRATION.md       ← what the client's team reads first
```

Two directories carry the whole handover: **`lib/contracts`** (what the data looks like)
and **`lib/data/adapters`** (where it comes from).

---

## 4. The contract layer

Zod schemas are the single source of truth. They give us TS types, runtime validation at
the boundary, and — via `zod-to-json-schema` — a JSON Schema export, so it doesn't matter
if the client's backend is Node, PHP or Python.

```ts
// lib/contracts/product.ts
import { z } from "zod";

/** Money is ALWAYS integer minor units. Never floats — 19.90 * 3 lies. */
export const MoneySchema = z.object({
  amount: z.number().int(), // 1990 === 19,90 €
  currency: z.literal("EUR"),
});

/** LMIV — legally required for food sold at distance. See audit.md §5a. */
export const NutritionSchema = z.object({
  energyKj: z.number(),
  energyKcal: z.number(),
  fat: z.number(),
  saturates: z.number(),
  carbohydrates: z.number(),
  sugars: z.number(),
  protein: z.number(),
  salt: z.number(),
});

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  label: z.string(), // "5 kg", "100 g"
  netWeightGrams: z.number().int(),
  price: MoneySchema,
  basePrice: MoneySchema, // per kg — PAngV, see audit.md §5c
  availability: z.enum(["in_stock", "on_request", "made_to_order", "out_of_stock"]),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(), // locale-specific
  name: z.string(),
  summary: z.string(),
  description: z.string(), // already-rendered HTML or MDX string
  categorySlugs: z.array(z.string()),
  variants: z.array(ProductVariantSchema).min(1),
  images: z.array(z.object({ url: z.string().url(), alt: z.string() })),
  origin: z.string().nullable(), // "Indien"
  ingredients: z.string().nullable(),
  allergens: z.array(z.string()),
  nutrition: NutritionSchema.nullable(),
  /** Drives "Add to cart" vs "Request a quote" — replaces the €0.00 hack. */
  salesChannel: z.enum(["shop", "wholesale"]),
  taxRate: z.union([z.literal(7), z.literal(19)]), // see audit.md, VAT note
});

export type Product = z.infer<typeof ProductSchema>;
```

**Three decisions encoded here that matter:**

1. **`salesChannel`** — this single field removes the €0.00 / "Nicht verfügbar" workaround.
   The UI renders "In den Warenkorb" or "Preis anfragen" from data, not from a special case.
2. **Money in integer cents** — no float arithmetic anywhere.
3. **LMIV fields are first-class**, not an afterthought, so they can't be quietly skipped.

---

## 5. The data seam

Every read goes through here. Server-only, so swapping the adapter never touches a component.

```ts
// lib/data/index.ts
import "server-only";
import type { Locale, Product, Category, Page } from "@/lib/contracts";

export interface DataSource {
  getProducts(
    locale: Locale,
    opts?: { category?: string; channel?: "shop" | "wholesale" },
  ): Promise<Product[]>;
  getProduct(locale: Locale, slug: string): Promise<Product | null>;
  getCategories(locale: Locale): Promise<Category[]>;
  getPage(locale: Locale, slug: string): Promise<Page | null>;
  getAllSlugs(locale: Locale): Promise<{ products: string[]; pages: string[] }>;
}

// ── The only line the client's team changes ──
const source: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api"
    ? (await import("./adapters/api")).default
    : (await import("./adapters/mock")).default;

export const data = source;
```

Usage in a page — note there is nothing here to rewrite later:

```tsx
// app/[locale]/sortiment/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const product = await data.getProduct(locale, slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}

export async function generateStaticParams() {
  /* from data.getAllSlugs */
}
```

The `api` adapter ships as compiling stubs:

```ts
// lib/data/adapters/api/index.ts
import { ProductSchema } from "@/lib/contracts";

const BASE = process.env.API_BASE_URL!;

export default {
  async getProduct(locale, slug) {
    // TODO(backend): point at your endpoint. Response must satisfy ProductSchema.
    const res = await fetch(`${BASE}/${locale}/products/${slug}`, {
      next: { revalidate: 300, tags: [`product:${slug}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getProduct ${slug}: ${res.status}`);
    return ProductSchema.parse(await res.json()); // fail loudly on contract drift
  },
  // ...
} satisfies DataSource;
```

`ProductSchema.parse()` at the boundary is deliberate: if their API drifts from the
contract, it fails immediately with a precise message instead of rendering `undefined`
three components deep.

---

## 6. Mutations

Every write is a Server Action in `lib/actions/`, one file each, each ending in a stub.
Nothing else in the app performs a mutation.

```ts
// lib/actions/submit-enquiry.ts
"use server";
import { EnquiryInputSchema, type EnquiryResult } from "@/lib/contracts";

export async function submitEnquiry(raw: unknown): Promise<EnquiryResult> {
  const parsed = EnquiryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // TODO(backend): persist + notify sales.
  // Contract: EnquiryInputSchema. Expected: 200 + { id }.
  // Prototype behaviour: log and succeed.
  console.info("[stub] enquiry", parsed.data);

  return { ok: true, id: crypto.randomUUID() };
}
```

Checkout stops exactly at the handoff — we build the entire cart and checkout UI,
then hand them a typed call:

```ts
// lib/actions/create-checkout.ts
"use server";
export async function createCheckout(cart: CartInput): Promise<CheckoutResult> {
  // TODO(backend): re-read prices server-side from your DB — NEVER trust these amounts.
  // Create the provider session (Stripe/Mollie) and return its redirect URL.
  return { ok: true, redirectUrl: "/checkout/demo-success" };
}
```

That comment is the single most important line in the handover. It is the mistake
self-built shops make most often, and flagging it costs us nothing.

**Every stub is greppable:** `grep -rn "TODO(backend)" src/` prints the complete
integration worklist.

---

## 7. Bilingual from line one

Retrofitting i18n costs more than building with it. Rules:

- Routes are `/[locale]/...`, `de` is default, `en` fully built — **no English placeholders**
- **Zero hardcoded strings** in components — everything via `useTranslations` / `getTranslations`
- Slugs are localized: `/de/sortiment/negin-safran` ↔ `/en/range/negin-saffron`.
  The data layer takes `locale` for exactly this reason.
- `generateMetadata` emits `hreflang` alternates per page
- Locale-aware formatting for price, weight and date via `Intl`

Per `homepage-struktur.md`: shop content gets translated; Großhandel and Private Label
get independently written English aimed at export buyers — different buying motive.

---

## 7a. One trap worth writing down: replacing an image in place

`next/image` requests look like `/_next/image?url=/products/x/front.png&w=1080&q=75`.
The URL carries the PATH, a width and a quality — and **no content hash**. Replace the
file at that path and every cache in front of it keeps serving the old bytes.

This cost real time during the hero build. A product's photography was swapped from a
square crop to a 4:3 one, and that one slide kept rendering hugely zoomed while its
three neighbours were fine.

What made it hard to see:

- **The optimiser caches PER WIDTH.** Only `w=640` and `w=1920` were stale. Spot-checking
  `w=1080` returned a correct 4:3 image and looked like proof that nothing was wrong.
- **The dev cache is not where you would look.** It is `.next/dev/cache/images`, not
  `.next/cache/images`. Deleting the latter does nothing.
- **Clearing it under a running server does nothing either.** The entries come straight
  back. Stop the server, delete, restart.
- The file on disk and the PNG's own chunk structure were correct throughout, so every
  check that looked at the source came back clean.

**The diagnostic that actually works:** read an `<img>`'s `naturalWidth`/`naturalHeight`
in the page and compare the ASPECT RATIO against the file on disk. Ratios cannot lie —
a square decode from a 4:3 source is a cache, never the artwork. Then walk every width
in the `srcset`, not one:

```bash
for w in 384 640 750 828 1080 1920; do
  curl -s "http://localhost:3000/_next/image?url=%2Fproducts%2F<slug>%2Ffront.png&w=$w&q=75" -o /tmp/p
  python3 -c "from PIL import Image; im=Image.open('/tmp/p'); print($w, im.size)"
done
```

**The fix, and the rule for the client's team: when an asset changes, change its
filename** — `front-2.png`, or a content hash. Same path, new bytes is a cache-poisoning
pattern, and in production the stale copy sits in a CDN where no one can clear it by
restarting anything.

## 8. What we hand over

Beyond the code:

- **`INTEGRATION.md`** — 5 files to touch, in order, with the env vars
- **`.env.example`** — every variable, commented
- **`contracts/*.json`** — JSON Schema export, so a non-TS backend can validate too
- **`seed/`** — real content from the scrape, so their staging is never empty
- **Storybook** _(optional)_ — components in isolation; useful if they extend the UI later
- **Vercel preview URL** — clickable progress for the client throughout

### Handover checklist

- [ ] `grep -rn "TODO(backend)" src/` returns a complete, accurate worklist
- [ ] `NEXT_PUBLIC_DATA_SOURCE=api` compiles and type-checks
- [ ] No `fetch()` anywhere outside `lib/data/adapters/`
- [ ] No mutation outside `lib/actions/`
- [ ] No hardcoded user-facing string outside `i18n/messages/`
- [ ] Every price rendered through one `<Price>` component (tax + base price in one place)
- [ ] Lighthouse ≥ 95 SEO and Accessibility on home, category, product
- [ ] Both locales complete, no untranslated keys

---

## 9. Prototype build order

What to build so it demos well and de-risks early:

**1 — Homepage, German.** All 15 blocks from `homepage-struktur.md`.
This is what sells the project. Everything else is proof it's real.

**2 — Category + product detail.** Proves the data seam, variant picking, base-price
display, and `salesChannel` switching between "Add to cart" and "Request a quote".

**3 — Großhandel + enquiry form.** The actual revenue path. Full form, validation,
success state, stubbed submit.

**4 — Private Label.** Strongest existing content, nearly free.

**5 — Cart + checkout shell.** Proves the shape without touching payments.

**6 — English locale across all of it.** Never last in a real build, but for a
prototype it's the honest place — it proves the i18n architecture works end to end.

After step 3 the client can already see the whole concept working.
