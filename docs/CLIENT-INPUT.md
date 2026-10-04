# What we need from Hugo Tron

Everything the site cannot finish on its own: legal texts, prices, product data and access.
Where a value is missing, the site shows a general sentence instead of an invented figure, and
the gap is listed here.

**Blocker** = needed before the shop sells to consumers. **Important** = the page works, but is
weaker or carries a warning-letter (Abmahnung) risk. **Optional** = improves the result.

A detailed explanation of each legal point, for Hugo Tron's lawyer or Händlerbund, is in the
shared document "Hugo Tron — Legal & compliance: open questions".

---

## 1. Legal texts — Blocker

The site shows the texts that are live on hugo-tron.com today, unchanged (`src/content/legal/`),
plus the food return policy Hugo Tron supplied. Hugo Tron is a **Händlerbund member**;
Händlerbund provides and maintains these texts, in German and English, and can deliver them
through an API (`src/lib/legal/source.ts`).

| #   | Needed                                                                                                                                                       | Priority  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 1   | **Managing director (Geschäftsführer)** for the Impressum (§ 5 DDG)                                                                                          | Blocker   |
| 2   | Is the register entry _HRB 16973 PI, Amtsgericht Pinneberg_ still current (seat is Hamburg)?                                                                 | Important |
| 3   | **Consumer AGB** (contract formation, payment methods, delivery, warranty). Today's AGB are for businesses only                                              | Blocker   |
| 4   | Place of performance "Wedel" (AGB § 5) and the hugo-tron.de reference (§ 9) still correct?                                                                   | Important |
| 5   | **Withdrawal wording:** sealed food can be withdrawn until the seal is broken (§ 312g Abs. 2 Nr. 3 BGB); add the statutory Widerrufsbelehrung and model form | Blocker   |
| 6   | The 48-hour damage deadline cannot apply to consumers (§§ 437, 438 BGB) — business customers only?                                                           | Blocker   |
| 7   | Who pays return shipping after a withdrawal?                                                                                                                 | Important |
| 8   | Where the **"Vertrag widerrufen"** link lives permanently (footer recommended; § 356a BGB)                                                                   | Blocker   |
| 9   | Check our German translation of the supplied English return policy                                                                                           | Important |
| 10  | **New privacy policy** naming the host, payment providers, email service and Google/Apple sign-in                                                            | Blocker   |
| 11  | Data-processing agreements (AVV) with each of those providers                                                                                                | Blocker   |
| 12  | English versions of all legal texts (required when addressing customers abroad)                                                                              | Blocker   |
| 13  | Health claims on saffron and pistachios ("fördert die Verdauung" …) are likely not allowed (VO (EG) 1924/2006)                                               | Important |
| 14  | Attribution for the 3D courtyard model ("Shrine of the Oracle", Isabella Crowder, CC BY 4.0) somewhere visible on the site, or a replacement model           | Important |
| 15  | Licence of the two range films (`assets-src/video/`, likely Pexels)                                                                                          | Important |
| 15a | **Web licence for the Mersad title font** (commercial; the supplied package had no licence file)                                                             | Blocker   |

## 2. Prices, shipping, payment — Blocker

All of these go into `src/commerce/config.ts`.

| #   | Needed                                                                                                                                  | Today on the site                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 16  | **Shipping prices** and any free-shipping threshold (the old site said "free from 29 €" and "generally free")                           | "Depends on destination and service", total shown excl. shipping |
| 17  | Carrier and **delivery time** in working days                                                                                           | not shown                                                        |
| 18  | **Delivery countries** (live site: "europaweit")                                                                                        | DE, AT, NL, BE, LU, FR, DK, PL, CZ — placeholder                 |
| 19  | **Bank details** for prepayment (account holder, IBAN, BIC, bank)                                                                       | "bank details follow by email"                                   |
| 20  | **VAT rate** per product, confirmed by the tax adviser (7 % for basic foods is assumed)                                                 | 7 % for everything                                               |
| 21  | Which payment methods to offer (built: card, PayPal, Apple Pay, Klarna, prepayment). SEPA direct debit? Invoice for business customers? | all five shown                                                   |
| 22  | Self-collection at Friesenweg possible? Times?                                                                                          | not offered                                                      |
| 23  | Payment provider and merchant accounts (PayPal, Klarna, card processor)                                                                 | mock                                                             |

## 3. Product data — Blocker

Legally required for food sold online (LMIV Art. 14), shown before purchase. The easiest
source: photos of the back of every pack plus the supplier specification sheets.

| #   | Needed per product                                                     | Priority  |
| --- | ---------------------------------------------------------------------- | --------- |
| 24  | Ingredients, allergens, nutrition table per 100 g                      | Blocker   |
| 25  | Net quantity; **net weight of the tea pack** (needed for price per kg) | Blocker   |
| 26  | Country of origin; name and address of the food business operator      | Blocker   |
| 27  | Best-before / storage notes                                            | Important |
| 28  | SKU / EAN if they exist                                                | Optional  |
| 29  | Confirm current prices (Pardis 5 kg 18,90 €, 1 kg 3,90 € …)            | Important |

## 4. Wholesale and private label — Important

The pages describe sourcing, packaging and delivery in general terms and never state figures
that were not confirmed.

| #   | Needed                                                                        |
| --- | ----------------------------------------------------------------------------- |
| 30  | Minimum order quantities (wholesale and private label)                        |
| 31  | Lead times (stock items, import orders, private label)                        |
| 32  | Pack formats and sizes available for private label; who designs the packaging |
| 33  | Certificates (IFS, BRC, organic, HACCP) — shown prominently if they exist     |
| 34  | Samples: possible, free, up to which amount?                                  |
| 35  | A reference project or photos of finished packs that may be shown             |

## 5. Company, contact, access — Important

| #   | Needed                                                                                       |
| --- | -------------------------------------------------------------------------------------------- |
| 36  | Business hours and promised response time                                                    |
| 37  | Which inbox receives which contact topic (prices/samples, orders, general)                   |
| 38  | Which phone number for legal matters (office 040/210 788 69 or WhatsApp)                     |
| 39  | Real photos of the warehouse, team and goods                                                 |
| 40  | Founding year, number of customers, countries of origin — only if they may be published      |
| 41  | Access: domain registrar, DNS, email hosting, Google Search Console, Google Business Profile |
| 42  | Existing Wix customers and orders: migrate or not? (GDPR legal basis; passwords cannot move) |

## 6. Design leftovers — Optional

| #   | Needed                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------- |
| 43  | Illustrations for order and form messages (list in `src/components/commerce/feedback/illustrations.ts`)       |
| 44  | An "About" page (the nav item is hidden until it exists)                                                      |
| 45  | Final films and 3D scenes for the ranges that borrow placeholders (`src/content/categoryStories.ts`, `needs`) |
