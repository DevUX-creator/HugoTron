# Commerce: catalogue, cart and orders

## Range films and product rail

`RangeReveal` has a native sticky stage. Its existing 2.3-viewport reveal completes
before scroll distance moves the product rail. Rail travel is measured from the
actual cards; adding or removing catalogue items does not need animation changes.
The next section releases only after the last card is visible. Keyboard focus and
the previous/next buttons align cards with the viewport. Reduced motion uses a
native horizontal row without the pinned scroll journey.

## Catalogue

Components never import `src/content/products.ts` or `categories.ts`; they read
`src/lib/catalogue.ts` (`getProducts`, `getProduct`, `getCategory`,
`categoryProducts`, `isPurchasable`, `productImage`, `formatPrice`). Prices are
integer EUR cents. A product with `channel: "wholesale"` or a null price is
quoted: its card carries the Wholesale mark and an `EnquireLink`.

Shared commerce pieces live in `src/components/products/`: `useAddToCart` with
`AddToCartQuantity` / `AddToCartButton` (catalogue card, hero, rice page),
`EnquireLink`, and `useProductChoice` for ranges sold as several types and pack
sizes (basmati).

## Cart

The cart is local to the browser. `src/lib/cart/model.ts` validates the line
contract `{ productId, quantity }`, caps quantities at 99 and excludes quoted
lines. `store.ts` owns versioned local persistence, storage-event sync and the
React subscription. Only IDs and quantities are saved; prices, labels and media
come from the catalogue.

## Orders: requests paid by invoice

The cart drawer leads to `/checkout` (`OrderForm`). The buyer sends the cart
with contact, billing and delivery details; Hugo Tron confirms availability and
delivery by email and invoices. Nothing is charged online and no payment data
touches the site.

`submitOrder` (`src/app/[locale]/checkout/actions.ts`) checks, in order: the
bot trap, the schema (`lib/orders/schema.ts`), server-side pricing
(`lib/orders/pricing.ts`, which refuses any line the shop does not sell online),
the per-sender rate limit (`lib/rateLimit.ts`), then delivery. The buyer gets a
reference such as `HT-261001-Q7YD`, and the cart is cleared.

## Connecting the backend

1. **Orders**: add a provider to `src/lib/orders/provider.ts` (ERP, invoicing
   tool, sales mailbox) and select it with `ORDER_PROVIDER`. It receives the
   priced order with its reference and must throw on failure.
2. **Enquiries**: the same pattern in `src/lib/enquiry/provider.ts`
   (`ENQUIRY_PROVIDER`).
3. **Catalogue**: replace the bodies in `src/lib/catalogue.ts`. For a remote
   source, read it on the server and pass it down; keep stable product IDs.
4. **Cart**: for a server cart, replace `src/lib/cart/store.ts` behind the same
   `CartProvider` API and add pending/error states for mutations.
5. **Rate limiting** is in memory per instance; swap `lib/rateLimit.ts` for a
   shared store (Redis, a table) before running several instances.

`src/content/rangeFilms.ts` is the ordered film manifest. `FilmPlaylist` uses two
video slots: it prepares the next film near the end of the current one, waits for a
playable frame, then crossfades. It pauses offscreen and in background tabs; reduced
motion and data-saving preferences show the poster until playback is requested.
VP9/WebM is preferred, with H.264/MP4 fallback, and smaller mobile delivery files.
Original uploads are preserved. Re-encode with `python3 scripts/encode-range-films.py`.
