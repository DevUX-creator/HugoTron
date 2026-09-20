# Hugo Tron — Audit des Ist-Zustands

Grundlage: vollständiger Abzug von hugo-tron.com, September 2026.
11 Seiten + 9 Produkte + 1 Kategorie. Technisch: **Wix** (inkl. Wix Stores).

---

## 1. Das zentrale Problem: Die Startseite verkauft nichts

Die Startseite besteht aus **genau zwei Textzeilen**:

> Ihre Quelle für erstklassige Lebensmittel ohne Umwege in Hamburg
> Entdecken Sie eine vielfältige Auswahl an Reis, Pistazien, Nüssen, Gewürzen und vielem mehr.

Danach kommt der Footer. Kein Produkt, kein Preis, kein Vertrauenssignal, kein Angebot,
keine Zielgruppenansprache, kein zweiter Call-to-Action. Der einzige Button ist "Produkte".

Das ist nicht "verbesserungsfähig" — das ist eine Landingpage, die die gesamte Arbeit
der Website an die Navigation delegiert. Jeder Besucher, der nicht schon weiß, was er
will, verlässt die Seite ohne Grund zu bleiben. Die komplette Neustrukturierung steht in
`homepage-struktur.md` und ist der wichtigste einzelne Hebel des gesamten Projekts.

---

## 2. Gespaltene Identität — B2C-Shop und B2B-Großhandel stehen unverbunden nebeneinander

Die Website versucht zwei völlig verschiedene Geschäfte gleichzeitig, ohne sich für
eines zu entscheiden oder beide sauber zu trennen:

|            | **B2C-Shop**             | **B2B-Großhandel**                                |
| ---------- | ------------------------ | ------------------------------------------------- |
| Artikel    | 6 kaufbare Produkte      | 5 Artikel in 25-kg-Säcken + Private Label         |
| Preise     | 3,49 € – 19,90 € brutto  | "auf Anfrage", keine Preise sichtbar              |
| Bestellweg | Warenkorb, Sofortkauf    | E-Mail an info@hugo-tron.com                      |
| Seiten     | `/category/all-products` | `/großhandel`, `/privatelabel`, `/zusammenarbeit` |
| Qualität   | dünn, keine Kategorien   | Private Label gut, Großhandel schwach             |

**Das sichtbarste Symptom:** Drei B2B-Artikel (Pistazienkerne, Pistazien mit Schale,
Kichererbsen 25 kg) liegen als **0,00-€-Produkte mit Status "Nicht verfügbar"** im
B2C-Shop — mit der E-Mail-Adresse im Produktnamen:

> "Pistazienkerne - Anfrage Großhändler an info@hugo-tron.com" · 0,00 € · Nicht verfügbar

Ein Drittel des Shops besteht aus Artikeln, die man nicht kaufen kann und die 0 € kosten.
Für einen Besucher wirkt das wie ein kaputter oder aufgegebener Shop. Für Google sind es
Produktseiten mit Preis 0 und Verfügbarkeit "out of stock" — beides schadet aktiv.

**Das ist ein Workaround für eine fehlende Funktion**, nämlich "Angebot anfragen" statt
"In den Warenkorb". Genau diese Funktion muss der neue Shop nativ können.

---

## 3. Versandkosten: drei widersprüchliche Aussagen

| Ort                        | Aussage                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Header-Banner (jede Seite) | "Kostenlose Lieferung ab 29 €"                                                                                          |
| `/lieferung`               | "Die Lieferung ist grundsätzlich kostenfrei", aber "ab einer bestimmten Entfernung können zusätzliche Kosten entstehen" |
| Jede Produktseite          | "inkl. MwSt. \| zzgl. Versand"                                                                                          |

Der Kunde kann vor dem Checkout nicht wissen, was die Lieferung kostet. Das ist der
meistgenannte Grund für Kaufabbrüche im E-Commerce überhaupt. Muss als Erstes aufgelöst werden.

Dazu: **"Keine Mindestbestellmenge"** — aber zu kleine Bestellungen werden in
Sammelbestellungen zusammengelegt, was die Lieferung "um einige Tage" verzögert, ohne
Obergrenze. De facto existiert eine Mindestmenge, sie wird nur nicht genannt.

---

## 4. Produktdaten sind für einen Lebensmittelhändler unvollständig

Aus dem Abzug der 9 Produkte: **keine SKUs, keine Nährwerte, keine Zutatenlisten,
keine Allergene, kein strukturiertes Ursprungsland, keine Netto-Preise, keine Staffelpreise,
keine EAN.** Nur ein einziges Produkt (Safran) hat überhaupt Varianten.

Dazu zwei konkrete Datenfehler:

- **Bei "Pardis 1121 Basmati" (18,90 €) und "Aladdin 1121 Basmati" (19,90 €) steht die
  Gebindegröße nirgends.** Es sind **5 kg** (intern bestätigt) — auf der Website erfährt der
  Kunde das nicht und soll knapp 20 € ohne Mengenangabe ausgeben.
- **Duplicate Content:** Die 1-kg-Varianten haben wortwörtlich denselben Beschreibungstext
  wie die großen Gebinde. Das sind keine eigenen Produkte, sondern Varianten.

---

## 5. Rechtliche Risiken — vor dem Relaunch prüfen lassen

Das sind Beobachtungen aus dem Text, keine Rechtsberatung. Ein Fachanwalt für
IT-/Lebensmittelrecht sollte das vor dem Livegang bewerten.

**a) LMIV-Pflichtangaben fehlen (VO (EU) 1169/2011).** Beim Fernabsatz von Fertigpackungen
müssen Zutatenverzeichnis, Allergene, Nährwerte, Nettofüllmenge und Verantwortlicher
**vor Kaufabschluss** verfügbar sein. Auf den Produktseiten steht davon nichts.
Abmahnrisiko, und für einen Lebensmittelhändler der kritischste Punkt der Liste.

**b) Unzulässige Health Claims beim Safran (VO (EG) 1924/2006).** "Förderung der Verdauung",
"Verbesserung der Stimmung", "starkes Antioxidans" sind gesundheitsbezogene Angaben,
die für Safran nicht in der Unionsliste zugelassen sind. Auch bei Pistazien
("zahlreiche gesundheitliche Vorteile") und Kichererbsen. Umformulieren auf sensorische
und kulinarische Beschreibung.

**c) Grundpreisangabe (PAngV).** Bei Lebensmitteln nach Gewicht ist der Grundpreis
(€/kg bzw. €/100 g) anzugeben. Ist auf den Produktseiten nicht erkennbar — besonders
relevant beim Safran mit sieben Gewichtsvarianten.

**d) Mängelrüge-Klausel gegenüber Verbrauchern.** `/lieferung` schließt nachträgliche
Mängelrügen aus. Gegenüber Kaufleuten ist das über § 377 HGB zulässig, gegenüber
Verbrauchern nach § 476 BGB nicht. Der Shop verkauft an beide → muss getrennt werden.

**e) AGB nur für Geschäftskunden.** Die AGB sind ausdrücklich "Allgemeine
Geschäftsbedingungen für **Geschäftskunden**" — es gibt aber einen offenen B2C-Shop.
Für Verbraucher fehlen damit passende AGB.

> **Korrektur (im Checkout geprüft, 2026-09-20):** Eine **Widerrufsbelehrung existiert** —
> sie ist im Wix-Checkout verlinkt, aber weder im Footer noch in der Sitemap, weshalb sie
> beim ersten Abzug nicht auftauchte. Im Footer steht zudem das Logo
> **„Mitglied im Händlerbund"** — der Kunde bezieht seine Rechtstexte also vermutlich von
> einem Dienstleister. Vor dem Relaunch klären, welche Texte von dort stammen und
> aktualisiert werden müssen, statt sie neu schreiben zu lassen.

**f) Stellenausschreibung "Buchhalterinnen"** ohne (m/w/d) — AGG-Risiko nach § 11 AGG.

---

## 6. SEO und Technik

**Umlaut-URLs:** `/überuns` und `/großhandel` werden als Punycode/Prozent-kodiert
ausgeliefert, sind schlecht teilbar und in Analytics unleserlich. Im Relaunch auf
`/ueber-uns` und `/grosshandel` mit 301.

**Eine einzige Kategorie.** Der gesamte Shop hängt unter `/category/all-products`.
Es gibt keine Kategorieseiten für "Basmati Reis", "Hülsenfrüchte", "Gewürze", "Nüsse" —
also keine einzige Seite, die auf die tatsächlichen Suchbegriffe optimiert ist.

**Keine Seiten für die Großhandelsartikel.** Rote Linsen, Spalterbsen, Kidneybohnen und
Bulgur existieren nur als Textzeilen auf `/großhandel`. "Bulgur 25kg Großhandel" ist eine
Suchanfrage mit klarer Kaufabsicht ohne passende Zielseite.

**Meta-Description der Startseite** ist ~540 Zeichen lang (Google zeigt ~155), enthält einen
Grammatikfehler ("...anzubieten. die sie für ihre Gerichte benötigen.") und einen abgebrochenen Satz.

**Kein Blog, kein Content-Marketing.** Für Lebensmittelimport gäbe es naheliegende
Themen mit Suchvolumen: Sella- vs. weißer Basmati, Safranqualitäten (Negin/Sargol/Pushal),
Kichererbsen-Kaliber für Falafel. Aktuell null organische Einstiegspunkte.

**Nur Deutsch.** Private Label adressiert explizit "den europäischen Handel", Lieferung
erfolgt "europaweit" — aber es gibt keine englische Version.

**Wix als Plattform** setzt die Obergrenze für alles Weitere: keine echten B2B-Funktionen
(Kundengruppenpreise, Netto-Anzeige, Staffelpreise, Angebotsanfrage-Flow), begrenzte
Kontrolle über Performance und strukturierte Daten, schwierige ERP-Anbindung.

---

## 7. Inhaltliche Redundanz

`/zusammenarbeit` und `/großhandel` sprechen dieselbe Zielgruppe an (Großhändler,
Supermärkte, Restaurants), ohne sich zu unterscheiden. `/zusammenarbeit` besteht
ausschließlich aus Floskeln ("Win-Win-Situation", "Geschäftspotenzial maximieren") und
enthält keine einzige überprüfbare Aussage. Empfehlung: auflösen und durch drei echte
Zielgruppenseiten ersetzen (siehe `content/pages/zusammenarbeit.md`).

---

## 8. Was gut ist und bleiben soll

- **`/privatelabel`** — klar strukturiert, echte Argumente, 4-Schritte-Prozess,
  Zielgruppendefinition, zwei CTAs. Das Qualitätsniveau für alle anderen Seiten.
- **Die Produkttexte selbst** sind ordentlich geschrieben, sensorisch und konkret
  (bis auf die Health Claims und die Dubletten).
- **Die Positionierung "Direktimport ohne Zwischenhändler"** ist stark und stimmig —
  sie wird auf der Startseite nur nicht ausgespielt.
- **Die Firmendaten sind vollständig** (HRB, USt-IdNr., Finanzamt) — Impressum ist sauber.
- **Standort Hamburg** ist für Lebensmittelimport ein echtes Argument und wird bisher nicht genutzt.

---

## 9. Prioritäten für den Relaunch

| Prio | Maßnahme                                                             | Wirkung   | Aufwand |
| ---- | -------------------------------------------------------------------- | --------- | ------- |
| 1    | Startseite komplett neu (siehe `homepage-struktur.md`)               | sehr hoch | mittel  |
| 2    | B2B/B2C sauber trennen, "Angebot anfragen" als echte Funktion        | sehr hoch | mittel  |
| 3    | Versandkosten eindeutig und widerspruchsfrei                         | sehr hoch | gering  |
| 4    | LMIV-Pflichtangaben + Health Claims bereinigen                       | Pflicht   | mittel  |
| 5    | Kategoriestruktur statt "All Products"                               | hoch      | gering  |
| 6    | Produktdaten vervollständigen (SKU, Gebinde, Grundpreis, Netto)      | hoch      | hoch    |
| 6b   | Preisstaffel 1 kg vs. 5 kg korrigieren (siehe `products/catalog.md`) | mittel    | gering  |
| 7    | Eigene Seiten für die 5 Großhandelsartikel                           | hoch      | mittel  |
| 8    | `/zusammenarbeit` → 3 Zielgruppenseiten                              | mittel    | mittel  |
| 9    | B2C-AGB + Widerrufsbelehrung ergänzen                                | Pflicht   | gering  |
| 10   | Englische Version für Private Label / Export                         | mittel    | mittel  |
