# Produktkatalog — Ist-Zustand (migrierbar)

Stand: Abzug von hugo-tron.com, September 2026. 9 Produkte, 1 Kategorie (`all-products`).
Strukturierte Rohdaten: `content/_source/data/products.json`.

**Befund vorab:** Es gibt keine echte Kategoriestruktur (alles liegt in "All Products"), keine SKUs,
keine Nährwert-/Herkunftsfelder, und 3 von 9 Produkten sind als 0,00 €-"Nicht verfügbar"-Artikel
eingestellt, die eigentlich B2B-Anfragen sind. Das gehört im Redesign getrennt (siehe `content/strategy/homepage-struktur.md`).

---

## 1. Pardis 1121 Basmati aus Indien

- **Slug:** `pardis-basmati-reis`
- **Preis:** 18,90 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Gebinde:** 5 kg _(bestätigt 2026-09-20; steht heute nirgends auf der Produktseite)_
- **Grundpreis:** 3,78 €/kg
- **Bilder:** 3
- **Ribbon:** "Neu"

**Packshots:** `public/products/pardis-1121-basmati-indien/` — `front.png`,
`side.png`, `back.png`. Die Vorderseite ist das Übersichtsbild.

> **Angaben von der Packungsrückseite — NOCH NICHT BESTÄTIGT.**
> Das Rückseitenbild zeigt eine vollständige Nährwerttabelle, Ursprungsland
> und EAN. Genau die Daten, die laut `audit.md` §5a fehlen:
>
> | | je 100 g |
> |---|---|
> | Energie | 330 kcal |
> | Eiweiß | 8,4 g |
> | Kohlenhydrate | 74,0 g — davon Zucker 0,4 g |
> | Fett | 0,6 g — davon gesättigt 0,4 g |
> | Ballaststoffe | 2,4 g |
> | Natrium | 2 mg |
>
> Ursprungsland Indien · EAN 4270004058505 · Nettofüllmenge 5 kg
>
> **Nicht als Quelle verwenden, bevor der Kunde sie bestätigt.** Die Bilder
> sind gerenderte Packungsvisualisierungen, keine Fotos einer echten Packung —
> eine Zahl, die aus einem Render abgelesen wurde, ist keine Grundlage für eine
> gesetzlich vorgeschriebene Angabe. Abgleich mit dem Lieferantenspezifikations-
> blatt oder der realen Verpackung erforderlich (siehe `kundenfragebogen.md` §D).

**Headline:** Aroma pur für Ihr Restaurant
**Subline:** Pardis 1121 Sella Basmati

Entdecken Sie den aromatischen Extraklasse Basmati Reis von Pardis, der ideal für Restaurants und Feinschmecker ist. Dieser hochwertige Reis zeichnet sich durch sein unvergleichliches Aroma und seine feine Körnung aus, die auch nach dem Kochen nicht verklebt. Ursprünglich aus Indien stammend, ist dieser Basmati Reis von Pardis bekannt für seine überragende Qualität und seinen köstlichen Geschmack. Perfekt geeignet für die Zubereitung von exotischen Gerichten oder als Beilage zu verschiedenen Speisen – dieser Basmati Reis wird Sie mit seinem erstklassigen Geschmack begeistern. Holen Sie sich jetzt den Pardis Basmati Reis und genießen Sie die feinste Qualität indischen Reises in Ihren Gerichten.

---

## 2. Aladdin 1121 Basmati aus Pakistan

- **Slug:** `aladdin-basmati-reis-1`
- **Preis:** 19,90 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Gebinde:** 5 kg _(bestätigt 2026-09-20; steht heute nirgends auf der Produktseite)_
- **Grundpreis:** 3,98 €/kg
- **Bilder:** 3
- **Ribbon:** "Neu"

**Headline:** Aladdin Basmati Reis
**Subline:** 1121 Creamy Sella Basmati aus Pakistan — Unvergesslicher Duft und Geschmack

Entdecken Sie den exquisiten Basmati Reis von Aladdin, ideal für Feinschmecker und alle, die hochwertigen Reis zu schätzen wissen. Dieser erstklassige Reis aus Pakistan besticht durch seinen unvergesslichen Duft beim Kochen und seine extra langen Körner, die selbst anspruchsvollste Gaumen erfreuen. Der Aladdin Sella 1121 Reis bietet nicht nur herausragende Qualität, sondern auch einen Geschmack, der das Wasser im Mund zusammenlaufen lässt. Perfekt für die Zubereitung exotischer Gerichte oder als delikate Beilage zu verschiedensten Speisen – dieser Basmati Reis wird Sie und Ihre Gäste mit seinem erstklassigen Geschmack und seiner feinen Textur begeistern. Gönnen Sie sich jetzt den Aladdin Basmati Reis und genießen Sie die unvergleichliche Qualität und den köstlichen Duft pakistanischen Reises in Ihren Gerichten.

---

## 3. Pardis Basmati aus Indien 1kg

- **Slug:** `pardis-basmati-aus-indien-1kg`
- **Preis:** 3,90 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Gebinde:** 1 kg
- **Grundpreis:** 3,90 €/kg
- **Bilder:** 1
- **Ribbon:** "Neu"

**Headline:** Aroma pur aus Indien
**Subline:** Pardis Sella Basmati

Entdecken Sie den aromatischen Extraklasse Basmati Reis von Pardis, der ideal für Restaurants und Feinschmecker ist. Dieser hochwertige Reis zeichnet sich durch sein unvergleichliches Aroma und seine feine Körnung aus, die auch nach dem Kochen nicht verklebt. Ursprünglich aus Indien stammend, ist dieser Basmati Reis von Pardis bekannt für seine überragende Qualität und seinen köstlichen Geschmack. Perfekt geeignet für die Zubereitung von exotischen Gerichten oder als Beilage zu verschiedenen Speisen – dieser Basmati Reis wird Sie mit seinem erstklassigen Geschmack begeistern. Holen Sie sich jetzt den Pardis Basmati Reis und genießen Sie die feinste Qualität indischen Reises in Ihren Gerichten.

> **Hinweis:** Text ist identisch mit Produkt 1. Duplicate Content — im Redesign muss der 1-kg-Artikel
> eine eigene Beschreibung bekommen oder besser: **als Variante von Produkt 1 geführt werden**.

---

## 4. Aladdin Basmati aus Pakistan 1kg

- **Slug:** `aladdin-basmati-aus-pakistan-1kg`
- **Preis:** 4,90 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Gebinde:** 1 kg
- **Grundpreis:** 4,90 €/kg
- **Bilder:** 1
- **Ribbon:** "Neu"

**Headline:** Aladdin Basmati Reis aus Pakistan
**Subline:** Creamy Sella Basmati aus Pakistan — Unvergesslicher Duft und Geschmack

Entdecken Sie den exquisiten Basmati Reis von Aladdin, ideal für Feinschmecker und alle, die hochwertigen Reis zu schätzen wissen. Dieser erstklassige Reis aus Pakistan besticht durch seinen unvergesslichen Duft beim Kochen und seine extra langen Körner, die selbst anspruchsvollste Gaumen erfreuen. Der Aladdin Sella 1121 Reis bietet nicht nur herausragende Qualität, sondern auch einen Geschmack, der das Wasser im Mund zusammenlaufen lässt. Perfekt für die Zubereitung exotischer Gerichte oder als delikate Beilage zu verschiedensten Speisen – dieser Basmati Reis wird Sie und Ihre Gäste mit seinem erstklassigen Geschmack und seiner feinen Textur begeistern. Gönnen Sie sich jetzt den Aladdin Basmati Reis und genießen Sie die unvergleichliche Qualität und den köstlichen Duft pakistanischen Reises in Ihren Gerichten.

> **Hinweis:** Text identisch mit Produkt 2 — gleiche Empfehlung: als Variante führen.

---

## 5. Premium Negin Safran

- **Slug:** `safran`
- **Preis:** ab 4,90 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Varianten:** "Artikelgewicht wählen" → 1 g · 5 g · 10 g · 50 g · 100 g · 500 g · 1000 g
- **Bilder:** 2

**Das einzige Produkt im Shop mit echter Variantenlogik — und das mit Abstand stärkste Margenprodukt.**

Entdecken Sie die Magie des Safrans! Wir freuen uns, Ihnen die besten Safranfäden der Welt direkt aus dem Iran anbieten zu können. Unsere Safranfäden stammen aus den besten Anbaugebieten und werden mit größter Sorgfalt geerntet, um Ihnen die höchste Qualität zu garantieren.

Safran ist bekannt als das wertvollste Gewürz der Welt und zeichnet sich durch seinen unvergleichlichen Geschmack, seine intensive Farbe und sein unverwechselbares Aroma aus. Unsere iranischen Safranfäden sind reich an Crocin, Picrocrocin und Safranal – die Stoffe, die für die tiefrote Farbe, den einzigartigen Geschmack und das intensive Aroma verantwortlich sind. Diese Eigenschaften machen unseren Safran zu einer unverzichtbaren Zutat für Ihre Küche.

Die gesundheitlichen Vorteile von Safran sind ebenfalls beeindruckend. Es wird traditionell zur Förderung der Verdauung, zur Verbesserung der Stimmung und als starkes Antioxidans verwendet. Darüber hinaus verleiht Safran Ihren Gerichten nicht nur eine exquisite Note, sondern auch eine wunderschöne goldgelbe Farbe.

Wir bieten Ihnen die besten Safranfäden in verschiedenen Packungsgrößen an, perfekt für den privaten Gebrauch und für die Gastronomie. Vertrauen Sie auf die Qualität unseres Safrans und erleben Sie den Unterschied, den echter iranischer Safran in Ihren kulinarischen Kreationen macht.

Bestellen Sie noch heute und bringen Sie den Luxus und die Raffinesse von echtem iranischen Safran in Ihre Küche. Überzeugen Sie sich selbst von der hervorragenden Qualität unserer Safranfäden – die besten der Welt!

> **Achtung, gesundheitsbezogene Angaben:** "Förderung der Verdauung", "Verbesserung der Stimmung",
> "starkes Antioxidans" sind Health Claims und in der EU nach VO (EG) 1924/2006 für Safran **nicht zugelassen**.
> Im Redesign umformulieren (siehe `content/strategy/audit.md`, Punkt "Rechtliche Risiken").

---

## 6. Vahdam — Earl Grey — Pyramiden-Teebeutel

- **Slug:** `vahdam-earl-grey-pyramiden-teebeutel`
- **Preis:** 3,49 € (inkl. MwSt., zzgl. Versand)
- **Verkaufsart:** Shop / Direktkauf
- **Bilder:** 1

VAHDAM India Earl Grey vereint feinste indische Schwarztee-Blätter mit aromatischem Bergamotte-Zitrusgeschmack in pflanzenbasierten Pyramiden-Teebeuteln und sorgt für ein volles, duftendes Geschmackserlebnis.

Die praktische Pyramidenform ermöglicht es den Teeblättern, sich optimal zu entfalten, und garantiert eine intensive und ausgewogene Aromaentfaltung in jeder Tasse. VAHDAM India hat sich als hochwertige Teemarke international etabliert und beliefert Kunden weltweit direkt aus Indien – ohne Zwischenhandel und mit kurzen Lieferketten.

> **Strategischer Fremdkörper:** Einzelnes Handelsprodukt einer Fremdmarke zwischen lauter
> Direktimport-Eigensortiment. Entweder Tee als eigene Kategorie ausbauen oder auslisten.

---

## 7. Pistazienkerne — _B2B-Anfrage, kein Shop-Artikel_

- **Slug:** `pistazienkerne`
- **Aktueller Zustand:** 0,00 € · "Nicht verfügbar" · Produktname enthält "Anfrage Großhändler an info@hugo-tron.com"
- **Gebinde:** 10 kg · 25 kg · 50 kg Säcke
- **Bilder:** 1

Unsere hochwertigen Pistazienkerne sind perfekt zum rohen Naschen, Backen, zur Herstellung von Konditorei-Spezialitäten und zum Verwenden in Salaten geeignet. Sie stammen aus besten Quellen und bieten höchste Qualität für Ihre kulinarischen Kreationen. Mit ihrem reichen Geschmack und knackiger Konsistenz sind sie die ideale Zutat für Ihre Lieblingsrezepte. Zusätzlich zu ihrem köstlichen Geschmack bieten Pistazien zahlreiche gesundheitliche Vorteile, da sie reich an Protein, Ballaststoffen und wichtigen Nährstoffen sind. Bestellen Sie jetzt in praktischen 10, 25 oder 50 kg Säcken und genießen Sie den vollen Geschmack und die Vielseitigkeit unserer Pistazienkerne.

---

## 8. Pistazien mit Schale — _B2B-Anfrage, kein Shop-Artikel_

- **Slug:** `pistazien-mit-schale`
- **Aktueller Zustand:** 0,00 € · "Nicht verfügbar" · Anfrage-Hinweis im Produktnamen
- **Gebinde:** 10 kg Säcke
- **Sorten:** naturbelassen · mit Safran veredelt · gesalzen
- **Bilder:** 1

Unsere hochwertigen Pistazien mit Schale sind in verschiedenen köstlichen Varianten erhältlich: naturbelassen, mit Safran veredelt und gesalzen. Perfekt zum Snacken und Genießen, bieten diese Pistazien höchste Qualität und besten Geschmack. Sie stammen aus den besten Anbaugebieten und werden sorgfältig verarbeitet, um Ihnen ein unvergleichliches Geschmackserlebnis zu bieten.

Naturbelassene Pistazien überzeugen durch ihren puren, authentischen Geschmack und ihre knackige Konsistenz. Die mit Safran veredelten Pistazien bieten eine exquisite und luxuriöse Note, die Ihre Sinne verwöhnt. Die gesalzenen Pistazien sind der klassische Snack für jede Gelegenheit, perfekt ausbalanciert und unwiderstehlich lecker.

Pistazien sind nicht nur ein Genuss, sondern auch reich an Proteinen, Ballaststoffen und wichtigen Nährstoffen. Bestellen Sie jetzt unsere Pistazien mit Schale in praktischen 10 kg Säcken und erleben Sie den vollen Geschmack und die Vielfalt unserer hochwertigen Produkte.

> **Die drei Sorten sind Varianten** — im neuen Shop als Variantenachse "Veredelung" abbilden.

---

## 9. Kichererbsen 25 kg — _B2B-Anfrage, kein Shop-Artikel_

- **Slug:** `kichererbsen-25kg`
- **Aktueller Zustand:** 0,00 € · "Nicht verfügbar" · Anfrage-Hinweis im Produktnamen
- **Gebinde:** 25 kg Sack
- **Spezifikation:** 7 mm
- **Bilder:** 1

Unsere 25kg Packung Kichererbsen eignet sich perfekt für Gastronomiebetriebe, Lebensmittelhersteller und Großverbraucher. Die Kichererbsen sind vor allem für die Zubereitung von orientalischen Gerichten wie Falafel bekannt, aber auch allgemein als vegane Proteinquelle sehr beliebt. Die Hülsenfrüchte sind reich an Ballaststoffen, Proteinen und Mineralstoffen, was sie zu einer gesunden und vielseitigen Zutat für zahlreiche Gerichte macht. Ob als Basis für Salate, Eintöpfe, Currys oder als würziger Snack – unsere Kichererbsen sind vielseitig einsetzbar und liefern natürliche Nährstoffe. Bestellen Sie noch heute und profitieren Sie von unserer qualitativ hochwertigen 25kg Packung zu einem fairen Preis.

---

## Nur auf der Großhandelsseite gelistet (nicht im Shop)

Diese fünf Artikel existieren heute **nur als Text** auf `/großhandel` — ohne Produktseite, ohne Bild,
ohne SEO-Wert. Im Redesign werden das vollwertige B2B-Produktseiten mit Anfrage-Formular:

| Artikel           | Gebinde    | Positionierung laut Website                              |
| ----------------- | ---------- | -------------------------------------------------------- |
| Kichererbsen      | 25-kg-Sack | Durchgehend auf Lager, kurzfristig lieferbar             |
| Rote Linsen       | 25-kg-Sack | Direktimport nach Bestellung gemäß Kundenanforderung     |
| Gelbe Spalterbsen | 25-kg-Sack | Bezug und Import projektbezogen nach Bestellung          |
| Kidneybohnen      | 25-kg-Sack | Beschaffung und Import nach Bedarf                       |
| Bulgur            | 25-kg-Sack | Flexible Qualitäten, Beschaffung und Import nach Auftrag |

**Nur Kichererbsen sind lagernd.** Alles andere ist Auftragsimport — das ist eine wichtige
Info für die Erwartungssteuerung und gehört klar auf die Seite (Lieferzeit-Badge).

---

## Datenfelder, die für den neuen Shop fehlen und erhoben werden müssen

| Feld                               | Warum nötig                                       |
| ---------------------------------- | ------------------------------------------------- |
| SKU / Artikelnummer                | Bestellung, ERP, Wiederbestellung im B2B          |
| ~~Gebindegröße bei Produkt 1 & 2~~ | **Geklärt: 5 kg.** Muss auf die Produktseite.     |
| Netto-Preise (B2B)                 | B2B kauft netto; heute nur brutto                 |
| Staffelpreise                      | Kernmechanik im Großhandel, existiert heute nicht |
| Ursprungsland (strukturiert)       | Pflichtangabe, heute nur im Fließtext             |
| Nährwerte je 100 g                 | LMIV-Pflicht bei Fertigpackungen im Fernabsatz    |
| Zutaten / Allergene                | LMIV-Pflicht                                      |
| Zollcode / EAN                     | Export, Logistik                                  |
| Haltbarkeit / Lagerhinweis         | Lebensmittel-Standard                             |
| Lagerbestand                       | "Sofort lieferbar" vs. "Auftragsimport"           |

---

## Preisstaffel — Beobachtung (nach Klärung der 5-kg-Gebinde)

| Produkt                         | 1 kg   | 5 kg    | €/kg bei 5 kg | Ersparnis |
| ------------------------------- | ------ | ------- | ------------- | --------- |
| Pardis 1121 Basmati (Indien)    | 3,90 € | 18,90 € | 3,78 €        | **3 %**   |
| Aladdin 1121 Basmati (Pakistan) | 4,90 € | 19,90 € | 3,98 €        | **19 %**  |

Bei Aladdin lohnt sich das größere Gebinde deutlich, bei Pardis praktisch nicht.
Wer fünfmal 1 kg Pardis kauft, zahlt 19,50 € statt 18,90 € — 60 Cent Unterschied.
Das ist kein Kaufanreiz, sondern eine Einladung, beim kleinen Gebinde zu bleiben.

Im Relaunch entweder die Staffel schärfen (5 kg spürbar günstiger) oder die 1-kg-Größe
als bewusstes Probier-/Aufpreisgebinde positionieren. Sobald Grundpreise nach PAngV
sichtbar ausgewiesen werden — und das ist Pflicht —, fällt diese Inkonsistenz jedem Kunden auf.
