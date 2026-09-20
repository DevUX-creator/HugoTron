# URL-Struktur, Redirects & Meta-Angaben

## Alte URLs → neue URLs

| Alt (Wix)                | Neu                 | Redirect                   |
| ------------------------ | ------------------- | -------------------------- |
| `/`                      | `/`                 | —                          |
| `/überuns`               | `/ueber-uns`        | 301                        |
| `/großhandel`            | `/grosshandel`      | 301                        |
| `/privatelabel`          | `/private-label`    | 301                        |
| `/zusammenarbeit`        | `/geschaeftskunden` | 301 (Seite wird aufgelöst) |
| `/lieferung`             | `/lieferung`        | —                          |
| `/kontakt`               | `/kontakt`          | —                          |
| `/stellenangebote`       | `/karriere`         | 301                        |
| `/agb`                   | `/agb`              | —                          |
| `/datenschutz`           | `/datenschutz`      | —                          |
| `/impressum`             | `/impressum`        | —                          |
| `/category/all-products` | `/sortiment`        | 301                        |
| `/product-page/{slug}`   | `/produkt/{slug}`   | 301, je Produkt            |

**Wichtig:** Alle 9 Produkt-URLs einzeln mappen. Wix nutzt `/product-page/…`, das Muster
verschwindet — ohne Einzelredirects gehen die indexierten Seiten verloren.

| Alte Produkt-URL                                     | Neue URL                                       |
| ---------------------------------------------------- | ---------------------------------------------- |
| `/product-page/pardis-basmati-reis`                  | `/produkt/pardis-1121-basmati-indien`          |
| `/product-page/aladdin-basmati-reis-1`               | `/produkt/aladdin-1121-basmati-pakistan`       |
| `/product-page/pardis-basmati-aus-indien-1kg`        | → Variante von `pardis-1121-basmati-indien`    |
| `/product-page/aladdin-basmati-aus-pakistan-1kg`     | → Variante von `aladdin-1121-basmati-pakistan` |
| `/product-page/safran`                               | `/produkt/negin-safran`                        |
| `/product-page/vahdam-earl-grey-pyramiden-teebeutel` | `/produkt/vahdam-earl-grey`                    |
| `/product-page/pistazienkerne`                       | `/grosshandel/pistazienkerne`                  |
| `/product-page/pistazien-mit-schale`                 | `/grosshandel/pistazien-mit-schale`            |
| `/product-page/kichererbsen-25kg`                    | `/grosshandel/kichererbsen-25kg`               |

Die letzten drei wandern vom Shop in den Großhandelsbereich — das sind die
0,00-€-"Nicht verfügbar"-Artikel, die dort nie hingehört haben.

## Neue Seiten (heute nicht vorhanden)

**Kategorieseiten** — `/sortiment/basmati-reis`, `/huelsenfruechte`, `/nuesse-kerne`,
`/gewuerze`, `/getreide`, `/tee`

**Großhandels-Artikelseiten** — `/grosshandel/kichererbsen-25kg`, `/rote-linsen-25kg`,
`/gelbe-spalterbsen-25kg`, `/kidneybohnen-25kg`, `/bulgur-25kg`
_(Diese fünf existieren heute nur als Textzeilen ohne eigene Seite — reines ungenutztes Suchvolumen.)_

**Zielgruppenseiten** — `/fuer-gastronomie`, `/fuer-handel`, `/fuer-wiederverkaeufer`

**Pflichtseiten** — `/widerruf` (fehlt heute), `/versand` (klare Kostentabelle)

**Optional** — `/muster-anfordern`, `/ratgeber/*` (Blog), `/en/*` (englische Version)

## Meta-Angaben

### Startseite

**Title:** `Lebensmittelgroßhandel Hamburg | Direktimport Reis, Hülsenfrüchte & Safran — Hugo Tron`

**Description:**

> Direktimport von Basmati-Reis, Hülsenfrüchten, Pistazien und Safran ab Ursprungsland.
> Großhandel, Private Label und Shop. Lieferung europaweit ab Hamburg.

_Die heutige Description hat ~540 Zeichen (Google zeigt ~155), enthält einen Grammatikfehler
("...anzubieten. die sie für ihre Gerichte benötigen.") und einen abgebrochenen Satz.
Sie wird von Google ohnehin nicht vollständig angezeigt._

### Weitere Seiten

| Seite         | Title                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Sortiment     | `Sortiment — Reis, Hülsenfrüchte, Nüsse & Gewürze \| Hugo Tron`                  |
| Großhandel    | `Lebensmittelgroßhandel — 25-kg-Gebinde ab Lager Hamburg \| Hugo Tron`           |
| Private Label | `Private Label für Reis & Hülsenfrüchte — Eigenmarke ab Werk \| Hugo Tron`       |
| Über uns      | `Über uns — Lebensmittelimport aus Hamburg seit [Jahr] \| Hugo Tron`             |
| Lieferung     | `Versand & Lieferung — Konditionen für Privat- und Geschäftskunden \| Hugo Tron` |
| Kontakt       | `Kontakt — Hugo Tron GmbH, Hamburg`                                              |

## Strukturierte Daten (Schema.org)

| Typ                              | Wo               | Nutzen                                                         |
| -------------------------------- | ---------------- | -------------------------------------------------------------- |
| `Organization` + `LocalBusiness` | global           | Knowledge Panel, lokale Sichtbarkeit                           |
| `Product` + `Offer`              | Produktseiten    | Preis & Verfügbarkeit im Snippet                               |
| `AggregateRating`                | Produktseiten    | Sterne im Snippet — **erst wenn echte Bewertungen existieren** |
| `BreadcrumbList`                 | alle Unterseiten | Pfad statt URL im Snippet                                      |
| `FAQPage`                        | Startseite, FAQ  | erweiterte Snippets                                            |
| `JobPosting`                     | Karriere         | Google-Jobsuche                                                |

**Achtung:** Die heutigen 0,00-€-Artikel liefern `Offer` mit `price: 0` und
`availability: OutOfStock` an Google. Das schadet aktiv und verschwindet mit der
Trennung von Shop und Großhandel.

## Technische Punkte beim Umzug von Wix

- [ ] Alle alten URLs vor Abschaltung dokumentieren (liegt vor: `content/_source/`)
- [ ] 301-Redirects **vor** Livegang testen
- [ ] Neue `sitemap.xml` einreichen, alte Wix-Sitemaps entfernen
- [ ] Google Search Console: Adressänderung, Coverage nach Livegang beobachten
- [ ] `robots.txt` neu (die alte enthält Wix-spezifische Regeln wie `/pro-gallery-webapp/`)
- [ ] Produktbilder aus Wix-CDN exportieren — IDs in `content/_source/data/products.json`
- [ ] Google Business Profile auf neue URLs prüfen
- [ ] Bestandskunden über neue Shop-URLs informieren
