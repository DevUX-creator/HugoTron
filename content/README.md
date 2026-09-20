# Hugo Tron — Content-Bestand & Redesign-Konzept

Vollständiger Abzug von hugo-tron.com (September 2026) plus Konzept für den Relaunch.
Quelle: Wix-Site mit 11 Seiten, 9 Produkten, 1 Kategorie.

## Was hier liegt

### Strategie — hier anfangen

| Datei                                    | Inhalt                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| **`strategy/homepage-struktur.md`**      | **Die neue Startseite: 15 Blöcke mit fertigen Texten.** Das Kernstück.        |
| `strategy/audit.md`                      | Was heute nicht funktioniert, inkl. rechtlicher Risiken, mit Prioritätenliste |
| `strategy/seo-redirects.md`              | URL-Mapping alt→neu, 301-Liste, Meta-Angaben, Schema.org                      |
| **`strategy/frontend-architecture.md`**  | **Frontend-Stack und Übergabe-Architektur — unser Liefergegenstand** (EN)     |
| `strategy/kundenfragebogen.md`           | Alle offenen Fragen an den Kunden, nach Priorität sortiert                    |
| `strategy/stack-empfehlung.md`           | Gesamtsystem-Einschätzung — überwiegend Backend, also **Sache des Kunden**    |
| `strategy/zahlungen-und-bestellungen.md` | Konkreter Ablauf von Zahlung, Steuer und Bestellung — B2C und B2B getrennt    |

### Bestandsinhalte — migrierfertig

| Datei                      | Inhalt                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `products/catalog.md`      | Alle 9 Produkte mit vollständigen Texten, Preisen, Varianten + fehlende Datenfelder |
| `pages/ueber-uns.md`       | Bestandstext + Bewertung + Vorschlag                                                |
| `pages/grosshandel.md`     | "                                                                                   |
| `pages/private-label.md`   | " (beste Bestandsseite)                                                             |
| `pages/zusammenarbeit.md`  | " (Empfehlung: auflösen)                                                            |
| `pages/lieferung.md`       | " (größtes Conversion-Problem)                                                      |
| `pages/kontakt.md`         | " + vollständige Firmendaten                                                        |
| `pages/stellenangebote.md` | "                                                                                   |
| `legal/agb.md`             | AGB im Wortlaut (nur Geschäftskunden!)                                              |
| `legal/datenschutz.md`     | Datenschutzerklärung im Wortlaut                                                    |
| `legal/impressum.md`       | Impressum im Wortlaut                                                               |

Jede Seitendatei ist gleich aufgebaut: **Bestandstext unverändert** → **Bewertung** →
**Vorschlag** → **offene Fragen**. Der Bestandstext ist wörtlich übernommen, damit beim
Umzug nichts verloren geht.

### Rohdaten

- `_source/raw-text/` — Textextrakt aller 21 abgerufenen Seiten
- `_source/data/products.json` — strukturierte Produktdaten inkl. Wix-Bild-IDs

## Die drei wichtigsten Befunde

**1. Die Startseite verkauft nichts.** Sie besteht aus zwei Sätzen und einem Button.
Kein Produkt, kein Preis, kein Vertrauenssignal, keine Zielgruppenansprache.

**2. B2C und B2B sind vermischt.** Drei Großhandelsartikel liegen als
0,00-€-Artikel mit Status "Nicht verfügbar" im Endkundenshop — mit der
E-Mail-Adresse im Produktnamen. Ein Drittel des Shops besteht aus nicht kaufbaren Artikeln.

**3. Versandkosten werden dreimal unterschiedlich angegeben.** Header, Lieferseite und
Produktseite widersprechen sich. Der Kunde weiß vor dem Checkout nicht, was er zahlt.

Dazu kommen Pflichtangaben, die für einen Lebensmittelhändler fehlen (LMIV: Nährwerte,
Allergene, Zutaten) sowie nicht zugelassene Health Claims. Details in `strategy/audit.md`, Abschnitt 5.

## Offene Fragen

Am Ende von `strategy/homepage-struktur.md` steht die gesammelte Liste der Zahlen und
Angaben, die für die fertigen Texte noch fehlen.

## Rahmenbedingungen

- **Zweisprachig DE + EN** — von Anfang an, nicht nachgerüstet (Private Label und Export
  adressieren den europäischen Handel; heute existiert kein englisches Wort auf der Site).
- Gebinde der 1121-Basmati-Artikel: **5 kg** (bestätigt 2026-09-20).
- Die 0,00-€-Artikel sind **Direktkontakt-Artikel** — sie brauchen einen echten
  Anfrage-Flow statt eines Warenkorb-Buttons.

## Rollenverteilung

Der Kunde hat bestätigt: **keine technischen Einschränkungen**, freie Wahl des Ansatzes.
Wir liefern **Konzept und Frontend**, der Kunde übernimmt Backend, Daten und Zahlungsanbindung.

Daraus folgt: `frontend-architecture.md` ist das maßgebliche Architekturdokument.
`stack-empfehlung.md` und `zahlungen-und-bestellungen.md` beschreiben das Gesamtsystem —
nützlich als Kontext und als Vorschlag an das Backend-Team, aber nicht unser Baubereich.

## Nächster Schritt

Prototyp aufsetzen nach `frontend-architecture.md`, Reihenfolge siehe dort Abschnitt 9.
