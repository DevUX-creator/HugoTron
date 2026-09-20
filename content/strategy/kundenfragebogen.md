# Fragebogen an Hugo Tron GmbH

Alle offenen Punkte aus Audit, Startseiten-Konzept und Technikempfehlung — gesammelt
in einem Dokument, das direkt an den Kunden gehen kann.

**Legende**
🔴 **Blockierend** — ohne diese Antwort kann der entsprechende Teil nicht gebaut werden
🟡 **Wichtig** — Text bleibt sonst schwächer als nötig oder enthält Platzhalter
🟢 **Optional** — verbessert das Ergebnis, ist aber kein Hindernis

---

## A — Zugänge & Übergabe 🔴

Das Erste, was wir brauchen. Ohne diese Punkte kann der Umzug technisch nicht vorbereitet werden.

- [ ] 🔴 Zugang zum Wix-Konto (Export von Produktdaten, Bestellungen, Kundendaten, Bildern)
- [ ] 🔴 Wo ist die Domain `hugo-tron.com` registriert? Zugangsdaten?
- [ ] 🔴 Wer hostet die E-Mail-Adressen `@hugo-tron.com`? _(Darf beim Domainumzug nicht ausfallen)_
- [ ] 🔴 Gibt es Google Search Console und Google Analytics? Zugang?
- [ ] 🟡 Google Business Profile vorhanden? Wer verwaltet es?
- [ ] 🟡 Originalbilder (nicht die Web-Versionen) verfügbar? Logo als Vektor (SVG/AI/EPS)?
- [ ] 🟡 Gibt es ein Corporate Design, Schriften, Farbvorgaben?
- [ ] 🔴 **Bestandskundendaten:** Wie viele Kundenkonten und Bestellungen liegen im Wix-Shop?
      Sollen sie übernommen werden? _(DSGVO: Übernahme braucht eine Rechtsgrundlage —
      Passwörter lassen sich ohnehin nicht migrieren.)_

---

## B — Zahlungen & Steuern 🔴

- [x] ~~Welche Zahlungsarten sind aktiv?~~ **Geprüft 2026-09-20:** Kredit-/Debitkarte,
      PayPal und Apple Pay. Es fehlen **SEPA-Lastschrift** und **Rechnungskauf** —
      zusammen rund ein Drittel der Zahlungspräferenzen im deutschen E-Commerce.
- [ ] 🟡 Sollen SEPA-Lastschrift und/oder Klarna im neuen Shop dazukommen?
- [ ] 🟡 **Im Checkout steht bei der Lieferung „Nicht verfügbar"** (vor Adresseingabe).
      Sind im Wix-Backend Versandzonen und -regeln korrekt hinterlegt?
- [ ] 🔴 **Welcher Umsatzsteuersatz wird aktuell ausgewiesen — 7 % oder 19 %?**
      Für Grundnahrungsmittel gilt in Deutschland in der Regel der ermäßigte Satz von 7 %.
      **Bitte vom Steuerberater bestätigen lassen** — falls bisher 19 % läuft, sollte das
      unabhängig vom Relaunch geprüft werden.
- [ ] 🔴 Welche Zahlungsarten soll der neue Shop anbieten?
      Vorschlag: PayPal, Kartenzahlung, Apple/Google Pay, SEPA-Lastschrift, ggf. Klarna
- [ ] 🟡 Rechnungskauf für Geschäftskunden: ab welchem Volumen, nach welcher Prüfung?
- [ ] 🔴 Wer stellt die Rechnungen für Großhandelsaufträge — welche Software?
      _(Relevant für eine spätere Anbindung)_
- [ ] 🟡 Wie viele Shop-Bestellungen kommen aktuell pro Monat?
      _(Bestimmt, wie viel Aufwand in den Checkout fließen sollte)_

---

## C — Versand & Lieferung 🔴

Aktuell stehen auf der Website **drei widersprüchliche Aussagen**: Der Header sagt
„kostenlos ab 29 €", die Lieferseite sagt „grundsätzlich kostenfrei, aber ab einer
bestimmten Entfernung Zusatzkosten", die Produktseiten sagen „zzgl. Versand".
Das muss eindeutig werden.

- [ ] 🔴 Was kostet der Versand wirklich? Gilt die Freigrenze von 29 €?
- [ ] 🔴 Ab welcher Entfernung entstehen Zusatzkosten — und wie hoch sind sie?
- [ ] 🔴 Liefergebiete: Deutschland, EU, weltweit? Unterschiedliche Preise je Zone?
- [ ] 🟡 Lieferzeit für Lagerware in Werktagen
- [ ] 🟡 Feste Liefertage im Großraum Hamburg? Eigenes Fahrzeug oder Spedition?
- [ ] 🟡 „Keine Mindestbestellmenge", aber kleine Bestellungen werden zu Sammelbestellungen
      zusammengelegt: **Ab welchem Wert entfällt das?** Wie lange dauert es maximal?
- [ ] 🟡 Selbstabholung am Friesenweg möglich? Zu welchen Zeiten?
- [ ] 🟢 Palettenversand: eigene Spedition oder Dienstleister?

---

## D — Produktdaten 🔴

Für jedes Produkt im Shop gesetzlich erforderlich (LMIV, VO (EU) 1169/2011) — heute
auf der Website nicht vorhanden:

- [ ] 🔴 **Zutatenverzeichnis** je Produkt
- [ ] 🔴 **Allergene** je Produkt
- [ ] 🔴 **Nährwerttabelle** je 100 g
- [ ] 🔴 **Nettofüllmenge**
- [ ] 🔴 **Ursprungsland** je Artikel
- [ ] 🔴 Name und Anschrift des Lebensmittelunternehmers _(vermutlich Hugo Tron selbst —
      bei Handelsware wie dem Vahdam-Tee ggf. abweichend)_
- [ ] 🟡 Mindesthaltbarkeit und Lagerhinweise
- [ ] 🟡 Artikelnummern/SKU — gibt es ein internes Nummernsystem?
- [ ] 🟢 EAN/GTIN je Artikel

**Hinweis:** Diese Angaben stehen auf der Verpackung bzw. im Spezifikationsblatt des
Lieferanten. Am einfachsten: Fotos aller Verpackungsrückseiten plus die
Lieferantenspezifikationen.

**Zusätzlich:**

- [ ] 🔴 **Kurztest:** Legt die Produktseite „Pardis Basmati 1kg" tatsächlich den
      1-kg-Artikel in den Warenkorb? Bei einem Test lag stattdessen der 5-kg-Artikel
      im Korb — vermutlich Altbestand der Browser-Sitzung, aber **nicht verifiziert**.
      Einmal im Inkognito-Fenster gegenprüfen.
- [ ] 🟡 Preisstaffel prüfen: Pardis kostet 3,90 €/kg einzeln und 3,78 €/kg im 5-kg-Gebinde
      — nur 3 % Ersparnis. Bei Aladdin sind es 19 %. Ist das so gewollt?
      _(Sobald Grundpreise ausgewiesen werden — und das ist Pflicht — fällt das Kunden auf.)_
- [ ] 🟡 Soll der Vahdam-Tee (Fremdmarke) im Sortiment bleiben oder ausgelistet werden?

---

## E — Großhandel 🟡

- [ ] 🟡 Mindestabnahmemenge je Artikel — Säcke, Paletten, Container?
- [ ] 🟡 Lieferzeit bei Auftragsimport in Wochen
- [ ] 🟡 Ursprungsländer je Artikel
- [ ] 🟡 Spezifikationen: Kichererbsen-Kaliber (7 mm bekannt), Linsensorte, Bulgur-Körnung
- [ ] 🟡 Musterversand möglich? Kostenlos? Bis zu welcher Menge?
- [ ] 🔴 **Zertifikate: IFS, BRC, Bio-Kontrollstelle, HACCP?**
      _(Im Lebensmittel-B2B oft Voraussetzung für eine Listung — falls vorhanden,
      gehört das prominent auf die Seite; falls nicht, brauchen wir andere Trust-Signale.)_
- [ ] 🟢 Laboranalysen/Datenblätter, die als Download angeboten werden könnten?

---

## F — Private Label 🟡

Die stärkste Seite der bestehenden Website — es fehlen nur die harten Zahlen:

- [ ] 🟡 Mindestauflage (MOQ) je Produktbereich
- [ ] 🟡 Vorlaufzeit von Anfrage bis Lieferung
- [ ] 🟡 Verpackungsoptionen: Beutel, Vakuum, Sack, Karton? Welche Größen?
- [ ] 🟡 Wer erstellt das Verpackungsdesign — Kunde oder Hugo Tron?
- [ ] 🟡 Zertifizierungen der Abfüllbetriebe
- [ ] 🟢 Referenzprojekt, das gezeigt werden darf — auch anonymisiert?
- [ ] 🟢 Fotos von Verpackungsmustern oder fertiger Regalware

---

## G — Unternehmen & Vertrauen 🟡

Für die neue Startseite. Aktuell besteht die Über-uns-Seite aus einem Absatz ohne
ein einziges Foto und ohne eine einzige Zahl.

- [ ] 🟡 **Gründungsjahr** bzw. seit wann wird importiert
- [ ] 🟡 Ungefähre Anzahl belieferter Kunden
- [ ] 🟡 Anzahl der Ursprungsländer
- [ ] 🟡 Lieferungen pro Woche
- [ ] 🟢 Die Geschichte: Warum Hamburg? Warum orientalische Lebensmittel? Wer hat gegründet?
- [ ] 🟡 **Fotos von Lager, Team und Ware** — echte Bilder statt Stockfotos.
      Das ist der günstigste große Qualitätssprung für die ganze Website.
- [ ] 🟢 Referenzkunden, die zitiert werden dürfen — notfalls anonymisiert
      („Restaurant in Hamburg-Altona, Kunde seit 2019")

---

## H — Kontakt & Vertrieb 🟡

- [ ] 🟡 Geschäftszeiten
- [ ] 🟡 Zugesagte Reaktionszeit auf Anfragen _(Vorschlag: „innerhalb eines Werktags",
      Großhandelsangebote „innerhalb von 24 Stunden")_
- [ ] 🟡 Ansprechpartner mit Namen und Zuständigkeit — Vertrieb, Einkauf, Buchhaltung
- [ ] 🟢 WhatsApp Business vorhanden? _(Für Gastronomiekunden oft der realistischste Kanal)_
- [ ] 🟡 Wohin sollen Anfragen gehen? Eine Sammeladresse oder getrennt nach Typ?

---

## I — Sprache & Zielmärkte 🟡

- [ ] 🔴 **Englische Version ist gesetzt.** Sollen die deutschen Texte übersetzt werden,
      oder bekommt die englische Version eigene Texte mit Exportfokus?
      _(Meine Empfehlung: Shop-Inhalte übersetzen, Großhandel und Private Label
      eigenständig auf Export texten — das sind unterschiedliche Kaufmotive.)_
- [ ] 🟡 Wer liefert die englischen Texte — Kunde, Übersetzer, oder wir?
- [ ] 🟢 Welche Zielmärkte sind für Export am wichtigsten?
- [ ] 🟢 Weitere Sprachen später denkbar? _(Türkisch, Arabisch, Farsi liegen beim Sortiment nahe)_

---

## J — Rechtliches 🔴

Vom Kunden bei seinem Anwalt zu klären — **nicht von uns zu entscheiden**:

- [ ] 🔴 **AGB für Verbraucher fehlen.** Die bestehenden sind ausdrücklich „für
      Geschäftskunden", der Shop steht aber Privatkunden offen.
- [ ] 🟡 **Widerrufsbelehrung existiert** (im Checkout verlinkt), ist aber weder im Footer
      noch in der Sitemap erreichbar. Inhalt prüfen, Muster-Widerrufsformular ergänzen,
      regulär verlinken. _(Reis und Hülsenfrüchte verderben nicht schnell — die Ausnahme
      nach § 312g Abs. 2 BGB greift also nicht.)_
- [ ] 🔴 **Im Footer steht „Mitglied im Händlerbund".** Stammen AGB, Widerrufsbelehrung und
      Datenschutzerklärung von dort? Falls ja: Beim Relaunch dort aktualisierte Texte
      anfordern, statt neu schreiben zu lassen — das spart Geld und Haftungsrisiko.
- [ ] 🔴 **Mängelrüge-Klausel** auf der Lieferseite: gegenüber Kaufleuten über § 377 HGB
      zulässig, gegenüber Verbrauchern nach § 476 BGB nicht. Muss getrennt formuliert werden.
- [ ] 🔴 **Gesundheitsbezogene Angaben** bei Safran („fördert die Verdauung", „verbessert
      die Stimmung", „starkes Antioxidans") und Pistazien sind nach VO (EG) 1924/2006
      vermutlich nicht zulässig und sollten umformuliert werden.
- [ ] 🟡 **Stellenanzeige „Buchhalterinnen"** ohne (m/w/d) — AGG-Risiko nach § 11 AGG.
- [ ] 🟡 Datenschutzerklärung muss nach dem Relaunch angepasst werden
      (neue Dienste: Hosting, Zahlungsanbieter, E-Mail-Versand).

---

## K — Projektrahmen _(an den Auftraggeber, nicht an Hugo Tron)_

- [ ] Gewünschter Livetermin — gibt es saisonale Fixpunkte? _(Ramadan ist für dieses
      Sortiment ein relevanter Umsatzzeitraum)_
- [ ] Gibt es ein Design/Figma, oder entsteht das Frontend im Projekt?
- [ ] Wer pflegt die Inhalte nach dem Launch — Kunde selbst oder Betreuung?
      _(Bestimmt, wie viel Aufwand in die Admin-Oberfläche fließt)_
- [ ] Sollen Bestellungen später in eine Warenwirtschaft fließen? Welche?
- [ ] Ist Wartung/Betrieb Teil des Auftrags?

---

## Was zuerst beantwortet werden muss

Damit Phase 1 starten kann, reichen **A** (Zugänge), **C** (Versand) und **G** (Unternehmen).

**D** (Produktdaten) und **J** (Rechtliches) blockieren Phase 2 — den Shop-Livegang.
Beides braucht Vorlauf beim Kunden bzw. bei dessen Anwalt und sollte deshalb
**früh angestoßen werden**, auch wenn es erst später gebraucht wird.
