# Stack-Empfehlung

Geschrieben **vor** Einsicht in das bestehende Projekt des Auftraggebers — bewusst als
unvoreingenommene Einschätzung. Abgleich mit vorhandenen Konventionen erfolgt danach.

---

## 1. Was für ein Projekt ist das eigentlich?

Die Stack-Frage wird meistens falsch gestellt, weil "Shop" im Titel steht. Ein Blick auf
die tatsächlichen Zahlen:

|                             |                                            |
| --------------------------- | ------------------------------------------ |
| Direkt kaufbare Artikel     | **6**                                      |
| Preisspanne B2C             | 3,49 € – 19,90 €                           |
| Artikel "auf Anfrage" (B2B) | 8 (3 im Shop + 5 nur als Text)             |
| Inhaltsseiten               | 11                                         |
| Umsatzträger laut Website   | Großhandel (25-kg-Gebinde) + Private Label |
| Sprachen künftig            | **2 (DE + EN)**                            |

Der größte Warenkorb im Shop liegt bei rund 20 €. Der kleinste Großhandelsauftrag liegt
vermutlich beim Hundertfachen. **Das Geld liegt nicht im Checkout, sondern im Anfrageformular.**

Daraus folgt die zentrale Einsicht für die Stack-Wahl:

> Das hier ist zu 80 % eine zweisprachige, SEO-getriebene Content- und Lead-Site
> mit einem kleinen Shop daneben — und nicht zu 80 % eine Commerce-Plattform.

Wer hier eine Commerce-Plattform in den Mittelpunkt stellt, optimiert den kleinsten Teil
des Geschäfts und kämpft anschließend gegen das System, wenn es um das geht, was wirklich
zählt: mehrsprachige Inhaltsseiten, strukturierte Lebensmitteldaten, Angebotsanfragen
mit Status und Zielgruppenseiten.

---

## 2. Empfehlung

> ### Next.js 15 (App Router) + Payload CMS 3 + Postgres (Neon) + Stripe
>
> **Hosting Vercel · Medien auf Cloudflare R2 · Mail über Resend**
>
> Ein Repository, ein Deployment, eine Datenbank, ein Admin-Panel.

Payload 3 läuft **innerhalb** der Next.js-App — kein zweiter Backend-Service, kein
separates Deployment, kein eigener Admin-Host. Für ein Projekt, das langfristig von
einer Person gepflegt wird, ist das der entscheidende Unterschied.

### Die Bausteine

| Baustein          | Wofür                          | Warum genau das                                                                                                      |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Next.js 15**    | Frontend, Routing, SEO, ISR    | Server Components liefern statisch schnelle Kategorie- und Produktseiten; `[locale]`-Routing für DE/EN ist eingebaut |
| **Payload 3**     | CMS, Produkte, Anfragen, Admin | Schema in TypeScript, **native Feld-Lokalisierung**, sehr gutes Admin-UI für Nicht-Techniker                         |
| **Neon Postgres** | Datenbank                      | Serverless, Branching für Migrationen, günstig, skaliert von 9 auf 900 Produkte ohne Umbau                           |
| **Stripe**        | Zahlung B2C                    | Stripe Tax löst EU-Umsatzsteuer/OSS, Stripe Invoicing die Rechnungen                                                 |
| **Cloudflare R2** | Produktbilder                  | Keine Egress-Kosten, S3-kompatibel                                                                                   |
| **Resend**        | Transaktionsmails              | Anfragebestätigungen, Bestellmails, interne Benachrichtigungen                                                       |

---

## 3. Warum das für **dieses** Geschäft passt

### Zweisprachigkeit ist der stärkste Einzelgrund

Payload lokalisiert **auf Feldebene**, nicht auf Dokumentebene. Konkret: Ein Produkt ist
ein Datensatz. `name`, `beschreibung` und `slug` sind lokalisiert, `preis`, `sku`, `gebinde`
und `naehrwerte` nicht. Der Redakteur schaltet im selben Formular zwischen DE und EN um.

Der Unterschied ist praktisch groß: Wenn der Safranpreis sich ändert, änderst du ihn
**einmal**. Bei den meisten Shop-Systemen mit Übersetzungs-Plugin pflegst du zwei
Produktdatensätze und driftest über Monate auseinander. Bei einem bilingualen Katalog mit
LMIV-Pflichtdaten ist das kein Komfort-, sondern ein Korrektheitsthema.

Dazu kommt: `hreflang`, lokalisierte Slugs (`/produkt/negin-safran` ↔ `/en/product/negin-saffron`)
und zweisprachige Sitemaps entstehen aus denselben Daten statt aus einem Zusatzsystem.

Und der geschäftliche Punkt: Eure Private-Label-Seite adressiert ausdrücklich
"den europäischen Handel", geliefert wird "europaweit" — aber es gibt bis heute kein
englisches Wort auf der Website. **EN ist hier keine Übersetzung, sondern eine Marktöffnung.**

### "Angebot anfragen" wird eine echte Funktion statt eines Workarounds

Heute steht die E-Mail-Adresse im Produktnamen und der Preis auf 0,00 €. Das ist die
Notlösung für etwas, das das System nicht kann.

Bei Payload ist eine Anfrage einfach eine Collection: Artikel, Menge, Gebinde, Lieferort,
Wunschtermin, Firma, USt-IdNr., Status (`neu` → `Angebot raus` → `Muster` → `gewonnen`/`verloren`).
Das Admin-Panel wird damit nebenbei zum kleinen Vertriebs-CRM — ohne zusätzliches Tool,
ohne Abo, ohne Datenabgleich. Für den Teil des Geschäfts, der den Umsatz trägt, ist das
mehr wert als jede Checkout-Optimierung.

### LMIV-Pflichtdaten sind ein Schema-Problem, kein Plugin-Problem

Nährwerttabelle, Zutatenliste, Allergene, Ursprungsland, Losnummer, Verantwortlicher —
alles EU-Pflicht (VO 1169/2011) und heute auf der Website komplett abwesend. In Payload
sind das 40 Zeilen TypeScript, mit Pflichtfeld-Validierung. Bei Shop-Systemen sind es
Metafelder, Zusatz-Apps oder Freitext im Beschreibungsfeld — und damit etwas, das man
vergessen kann. Bei Lebensmitteln im Fernabsatz sollte man das nicht vergessen können.

Dasselbe gilt für den Grundpreis nach PAngV (€/kg, €/100 g): berechnetes Feld aus
Preis und Gebinde, automatisch überall korrekt — statt sieben handgepflegter Werte
allein beim Safran.

### Die Inhaltsseiten sind die eigentliche Arbeit

Aus dem Konzept kommen dazu: 6 Kategorieseiten, 5 Großhandels-Artikelseiten,
3 Zielgruppenseiten, FAQ, Ratgeber-Artikel — **mal zwei Sprachen**. Das ist klassische
CMS-Arbeit. Ein Shop-System, das Inhaltsseiten als Anhängsel behandelt, arbeitet hier
dauerhaft gegen dich.

### Betriebsaufwand bleibt bei einer Person tragbar

Ein Repo, ein `vercel deploy`, eine Datenbank. Keine Container, kein Redis, keine Worker,
kein separater Admin-Host, keine Plugin-Kompatibilitätsmatrix bei jedem Update.

---

## 4. Wo diese Wahl schwach ist — ehrlich

**Du besitzt den Checkout.** Umsatzsteuer, Rechnungen, Storno, Teillieferung, Widerruf —
das erledigt kein Anbieter für dich. Abgefedert durch Stripe Tax (EU-VAT/OSS automatisch)
und Stripe Invoicing (konforme Rechnungen), aber die Verantwortung bleibt im Projekt.
**Vertretbar, weil der B2C-Shop klein und bewusst einfach bleibt.** Bei 5.000 Bestellungen
im Monat würde ich anders entscheiden.

**Kein Zahlungsarten-Buffet out of the box.** Stripe deckt Karte, PayPal, Klarna, SEPA,
Apple/Google Pay ab. Das reicht für Deutschland. Rechnungskauf für B2B läuft ohnehin
außerhalb — manuell, mit Bonitätsprüfung, wie heute schon.

**Payload 3 ist jung.** Version 3 (Next-native) ist seit Ende 2024 stabil, aktiv
entwickelt, MIT-lizenziert und selbst hostbar — kein Vendor-Lock-in, die Daten liegen in
deinem Postgres. Aber es ist kein zehn Jahre altes Ökosystem. Wer maximale Boringness will,
nimmt Option B unten.

**Du baust Warenkorb und Checkout selbst.** Bei 6 Artikeln ohne Größen-/Farbmatrix ist das
überschaubar — aber es ist Arbeit, die Shopify geschenkt hätte.

---

## 5. Alternativen — und wann sie besser wären

### Option B — Shopify Basic + headless Next.js-Storefront

**Dann nehmen, wenn:** Der Checkout niemals dein Problem sein soll, oder B2C stärker
wächst als erwartet.

Commerce, Zahlung, Steuer, Rechtstexte und Bestellverwaltung sind gelöst. Next.js liefert
Inhaltsseiten und Anfrageformulare über die Storefront-API.

**Dagegen spricht:** Mehrsprachigkeit läuft über Shopify Markets + "Translate & Adapt" —
eine zweite Oberfläche, in der Übersetzungen getrennt von den Originaldaten leben. Genau
das Drift-Problem von oben. Echte B2B-Funktionen (Kundengruppenpreise, Netto-Anzeige,
Staffeln) gibt es erst ab **Shopify Plus (~2.000 €/Monat)** — für dieses Geschäft
ausgeschlossen. Dazu zwei Systeme, zwei Datenmodelle, ein Sync dazwischen. Laufende
Kosten ~40 €/Monat plus Transaktionsgebühren, dauerhaft.

### Option C — Shopware 6

**Dann nehmen, wenn:** B2C-Volumen deutlich wächst und ein deutscher Agenturpartner die
Pflege übernimmt.

Deutsches System, deutsches Recht ab Werk (Grundpreis, USt, Widerruf), ernstzunehmende
B2B-Komponente, Mehrsprachigkeit nativ.

**Dagegen spricht:** PHP/Symfony — passt nicht zu einem JS/TS-Entwickler, der das allein
pflegt. Für 9 Artikel massiv überdimensioniert. Hosting und Updates sind spürbarer
Aufwand. Das wäre die richtige Antwort auf eine andere Frage.

### Option D — Medusa v2 + Next.js

**Dann nehmen, wenn:** Der Katalog auf mehrere hundert SKUs mit komplexer
Preislogik wächst.

TypeScript, Open Source, native Price Lists und Customer Groups — technisch genau die
B2B-Preislogik, die hier fehlt.

**Dagegen spricht:** Separater Backend-Service, Worker, Redis, eigenes Deployment —
Betriebsaufwand für 6 kaufbare Artikel. Und für die Inhaltsseiten bräuchtest du **trotzdem**
ein CMS obendrauf. Dann lieber gleich CMS-zentriert denken, also Option A.

### Ausdrücklich nicht empfohlen

**Auf Wix bleiben.** Die Plattform ist die Ursache mehrerer Befunde aus dem Audit und
verhindert die wichtigsten Maßnahmen strukturell: keine echte Angebotsanfrage
(daher die 0,00-€-Artikel), keine Kundengruppenpreise, keine sauberen LMIV-Felder,
begrenzte Kontrolle über strukturierte Daten und Performance, mühsame Zweisprachigkeit.

**WooCommerce.** Funktioniert, aber Plugin-Stapel für Mehrsprachigkeit (WPML), B2B und
Anfragen — jedes Update ein Risiko. Schlechteste Langzeitwartbarkeit der Liste.

---

## 6. Umsetzung in Phasen

### Phase 1 — Fundament & Inhalte _(der größte Hebel)_

Next.js + Payload + Neon aufsetzen. Schema: Produkte (inkl. LMIV, Gebinde, Grundpreis),
Kategorien, Seiten, Anfragen. Lokalisierung DE/EN von Anfang an — **nicht nachrüsten**.
Neue Startseite nach `homepage-struktur.md`, alle Inhaltsseiten, 6 Kategorieseiten,
5 Großhandelsseiten. Anfrage- und Musterformulare live. 301-Redirects nach `seo-redirects.md`.

_Danach ist das Geschäft bereits besser aufgestellt als heute — noch ganz ohne Checkout._

### Phase 2 — Shop

Warenkorb, Stripe Checkout, Stripe Tax, Bestellbestätigung, Bestellverwaltung im Admin.
Bewusst schlank: 6 Artikel, eine Variantenachse (Safran-Gewichte).
B2C-AGB + Widerrufsbelehrung müssen hier vorliegen — **anwaltlich geprüft**.

### Phase 3 — B2B-Ausbau

Kundenkonten mit Netto-Preisen und Staffeln, Angebots-Pipeline im Admin, Wiederbestellung,
Bestellhistorie, Datenblatt-Downloads. Erst bauen, wenn Phase 1 zeigt, welche Anfragen
tatsächlich kommen.

### Phase 4 — Wachstum

Ratgeber/Blog für organischen Traffic, englischsprachige Export-Landingpages,
Bewertungen, ggf. ERP-Anbindung.

---

## 7. Laufende Kosten (geschätzt)

| Posten        | Monatlich                                              |
| ------------- | ------------------------------------------------------ |
| Vercel Pro    | ~20 €                                                  |
| Neon Postgres | 0 – 19 €                                               |
| Cloudflare R2 | ~1 €                                                   |
| Resend        | 0 € (Free-Tier reicht)                                 |
| Stripe        | keine Grundgebühr, ~1,5 % + 0,25 € je EU-Kartenzahlung |
| **Summe**     | **~25 – 45 €/Monat**                                   |

Vergleichbar mit den heutigen Wix-Kosten — ohne dessen Einschränkungen, und ohne
Plattformgebühr auf den Umsatz.

---

## 8. Offene Punkte für die Stack-Abstimmung

- [ ] Auth: Payload-eigene Kundenkonten oder ein externer Anbieter (z. B. Clerk)?
      Erst ab Phase 3 relevant — beides möglich.
- [ ] Sollen Bestellungen später in ein ERP/Warenwirtschaft fließen? Welches?
- [ ] Wer pflegt die Inhalte nach dem Launch — du oder der Kunde?
      Bestimmt, wie viel Arbeit in die Admin-UX fließt.
- [ ] Englische Texte: Übersetzung der deutschen Inhalte oder eigenständige Exporttexte?
- [ ] Gibt es ein Design/Figma, oder wird das Frontend im Rahmen des Projekts gestaltet?
