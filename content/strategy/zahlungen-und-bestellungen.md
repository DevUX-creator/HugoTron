# Zahlungen & Bestellungen — wie das konkret läuft

Ergänzung zu `stack-empfehlung.md`. Beantwortet: Was baut man selbst, was macht der
Dienstleister, und wo fließt das Geld?

---

## Der wichtigste Punkt vorab: Es gibt zwei völlig getrennte Wege

Die Verwirrung entsteht, wenn man "Zahlungen" als **ein** System denkt. Es sind zwei,
und sie haben fast nichts miteinander zu tun:

|                       | **Weg A — Shop (B2C)**          | **Weg B — Großhandel (B2B)**           |
| --------------------- | ------------------------------- | -------------------------------------- |
| Artikel               | 6 Artikel, 3,49 – 19,90 €       | 25-kg-Gebinde, Paletten, Private Label |
| Auslöser              | Kunde klickt "In den Warenkorb" | Kunde füllt Anfrageformular aus        |
| Preis                 | steht fest auf der Seite        | wird individuell kalkuliert            |
| Zahlung               | **sofort online, per Stripe**   | **Rechnung, Überweisung — offline**    |
| Online-Payment nötig? | ja                              | **nein**                               |
| Programmieraufwand    | überschaubar (siehe unten)      | **praktisch null**                     |

**Weg B braucht keine Zahlungsabwicklung.** Kein Checkout, keine Kreditkarte, kein
Zahlungsdienstleister. Das läuft heute schon so und soll auch so bleiben — eure eigene
Lieferseite sagt es: _„Zahlung entweder bei Entgegennahme der Ware oder innerhalb von
vierzehn Werktagen nach Erhalt der Lieferung."_ Das ist Rechnungskauf, wie im
Lebensmittelgroßhandel üblich. Die Rechnung kommt aus eurer Buchhaltung, nicht aus der Website.

Die Website muss für Weg B nur eines können: **die Anfrage sauber einsammeln und
zustellen.** Das ist ein Formular und ein Datensatz — kein Zahlungssystem.

Damit schrumpft die ganze Payment-Frage auf einen kleinen Shop mit sechs Artikeln
und ~20 € Warenkorb.

---

## Weg A im Detail — der B2C-Checkout

### Was Stripe übernimmt (und wir nicht bauen)

| Leistung             | Warum das viel wert ist                                             |
| -------------------- | ------------------------------------------------------------------- |
| Bezahlseite          | Von Stripe gehostet — Karte, PayPal, Klarna, SEPA, Apple/Google Pay |
| PCI-DSS              | Kartendaten berühren unseren Server nie. Kein Compliance-Audit.     |
| SCA / 3-D Secure     | In der EU Pflicht. Stripe erledigt den kompletten Flow.             |
| Betrugserkennung     | Stripe Radar, ohne Zusatzarbeit                                     |
| **Stripe Tax**       | Berechnet den korrekten Umsatzsteuersatz je Land automatisch        |
| **Stripe Invoicing** | Erzeugt konforme Rechnungs-PDFs                                     |
| Rückerstattungen     | Per Klick im Dashboard                                              |
| Auszahlung           | Sammelt das Geld und überweist rollierend aufs Firmenkonto          |

### Was wir selbst bauen

Und zwar wirklich nur das:

**1. Warenkorb**
Zustand im Browser (Artikel + Menge). Bei 6 Artikeln und einer Variantenachse
(Safran-Gewichte) unkompliziert.

**2. Checkout-Endpunkt** (`POST /api/checkout`)
Der sicherheitsrelevante Teil. Der Server nimmt **nur Artikel-IDs und Mengen** entgegen
und liest **Preise, Gebinde und Steuersätze frisch aus der eigenen Datenbank** — niemals
aus dem Browser. Sonst könnte jemand den Safran per DevTools auf 0,01 € setzen.
Danach: Stripe-Checkout-Session anlegen und den Kunden dorthin weiterleiten.

**3. Webhook** (`POST /api/webhooks/stripe`)
Das Herzstück. Stripe meldet zurück, dass bezahlt wurde. Wir prüfen die Signatur und legen
dann erst die Bestellung an, buchen Bestand ab und verschicken die Mails.

> **Wichtig:** Die Bestellung entsteht **im Webhook**, nicht auf der Danke-Seite. Wer den
> Browser nach der Zahlung schließt, hat trotzdem eine gültige Bestellung. Das ist der
> Fehler, den selbstgebaute Shops am häufigsten machen.

**4. Bestellübersicht im Admin**
In Payload eine `orders`-Collection: Nummer, Kunde, Positionen, Status
(`bezahlt` → `versendet` → `abgeschlossen`), Stripe-Referenz.

**5. E-Mails** über Resend: Bestellbestätigung an den Kunden, Benachrichtigung ans Büro.

**Das war's.** Realistisch ein paar hundert Zeilen — kein Zahlungssystem, sondern eine
Anbindung an eines.

### Der Ablauf, Schritt für Schritt

```
Kunde: "In den Warenkorb"  →  Warenkorb (Browser)
                                    ↓  Artikel-IDs + Mengen
                    unser Server: Preise aus DB, Session bei Stripe anlegen
                                    ↓  Weiterleitung
                    Stripe-Bezahlseite (Karte / PayPal / Klarna / SEPA)
                                    ↓  Kunde zahlt
            ┌───────────────────────┴───────────────────────┐
            ↓                                               ↓
   Kunde landet auf /danke                     Stripe ruft unseren Webhook
   (nur Anzeige)                               → Bestellung anlegen
                                               → Bestand abbuchen
                                               → Mails via Resend
                                               → Rechnungs-PDF (Stripe Invoicing)
                                                            ↓
                                     Auszahlung aufs Firmenkonto (rollierend)
```

Geld berührt niemals unseren Server. Wir erfahren nur: _„Bestellung X wurde bezahlt."_

---

## Umsatzsteuer — der Teil, den Stripe Tax abnimmt

Drei Fälle, die im Lebensmittelversand auftreten:

**1. Privatkunde in Deutschland** → deutsche Umsatzsteuer.
Bei Grundnahrungsmitteln (Reis, Hülsenfrüchte, Gewürze, Tee) gilt in Deutschland
in aller Regel der **ermäßigte Satz von 7 %**, nicht 19 %.

> ⚠️ **Zu prüfen:** Welchen Satz weist der Wix-Shop aktuell aus? Falls dort 19 % laufen,
> zahlt die Firma seit Monaten zu viel ab — oder weist falsch aus. Das gehört vom
> Steuerberater geklärt, bevor wir die Sätze in die neue Datenbank übernehmen.
> Der Steuersatz wird pro Produkt gepflegt, nicht global.

**2. Privatkunde im EU-Ausland** → bis 10.000 € Jahresumsatz EU-weit deutsche USt.,
darüber die Umsatzsteuer des Ziellandes (OSS-Verfahren). **Genau das berechnet Stripe Tax
automatisch.** Die OSS-Meldung selbst macht der Steuerberater — Stripe liefert die Zahlen.

**3. Geschäftskunde im EU-Ausland mit gültiger USt-IdNr.** → Reverse Charge, keine
Umsatzsteuer. Betrifft fast nur Weg B (Rechnung aus der Buchhaltung). Falls es im Shop
auftreten soll, prüft Stripe Tax die USt-IdNr. und stellt netto.

_Das ist der Grund, warum ich Stripe Tax mitnehme statt Steuersätze selbst zu rechnen.
0,5 % pro Transaktion — bei 20 € sind das 10 Cent. Dafür ist ein ganzes Problemfeld erledigt._

---

## Was der Checkout kostet

Beispielbestellung 20 €, EU-Karte:

| Posten                              | Betrag              |
| ----------------------------------- | ------------------- |
| Stripe Transaktion (1,5 % + 0,25 €) | 0,55 €              |
| Stripe Tax (0,5 %)                  | 0,10 €              |
| **Summe**                           | **~0,65 € ≈ 3,3 %** |

Keine Grundgebühr, keine Mindestumsätze. PayPal und Klarna liegen etwas höher, SEPA-Lastschrift
deutlich darunter. Zum Vergleich: Wix Payments liegt in einer ähnlichen Größenordnung,
Shopify käme mit Plattformgebühr obendrauf.

---

## Alternative zu Stripe: Mollie

Ehrlicherweise gehört Mollie erwähnt — im deutsch-niederländischen Raum stark verbreitet,
transparente Preise pro Zahlungsart, deutschsprachiger Support, oft günstiger bei
SEPA-Lastschrift und Klarna.

**Wofür trotzdem Stripe:** Stripe Tax hat bei Mollie kein gleichwertiges Gegenstück.
Die EU-Umsatzsteuerlogik müsste man dann selbst oder über einen dritten Dienst lösen —
und genau das will ich bei einem Lebensmittelhändler mit 7 %-Sätzen und EU-Versand vermeiden.

**Wenn** ihr ohnehin einen Steuerberater habt, der die OSS-Sätze pflegt, und die
Zahlungsgebühren stärker wiegen: Mollie ist eine legitime Wahl. Die Architektur
oben bleibt identisch — nur der Anbieter im Checkout-Endpunkt und im Webhook wechselt.
Der Wechsel wäre später ein Tagesprojekt, kein Umbau.

---

## Weg B im Detail — Großhandel, ohne Zahlungssystem

```
Kunde: "Angebot anfordern"
        ↓
Formular: Artikel · Menge · Gebinde · Lieferort · Termin · Firma · USt-IdNr.
        ↓
Payload-Collection `anfragen`   +   Mail ans Büro (Resend)
        ↓
Mensch kalkuliert und schickt ein Angebot
        ↓
Auftrag → Lieferung → Rechnung aus der Buchhaltung → Überweisung
```

Kein Zahlungsdienstleister, kein Checkout, kein Code jenseits des Formulars.

Der Fortschritt gegenüber heute liegt woanders: Statt einer E-Mail im Posteingang
entsteht ein **strukturierter Datensatz mit Status** (`neu` → `Angebot raus` → `Muster
verschickt` → `gewonnen` / `verloren`). Damit sieht man erstmals, wie viele Anfragen
reinkommen, welche Artikel gefragt sind und wo der Trichter leckt.

**Später optional (Phase 3):** Ein Kundenkonto für Stammkunden mit hinterlegten
Nettopreisen und Wiederbestell-Funktion. Aber auch dann bleibt die Zahlung Rechnung
auf Überweisung — nur die Bestellung wird digital ausgelöst. Erst bauen, wenn Phase 1
zeigt, dass Bedarf besteht.

---

## Rechtliches, das am Checkout hängt

Kein Code, aber Voraussetzung für den Livegang von Phase 2:

- [ ] **Widerrufsbelehrung** — **existiert** (im Checkout verlinkt), ist aber weder im
      Footer noch in der Sitemap erreichbar. Inhalt prüfen und regulär verlinken.
      Reis und Hülsenfrüchte verderben nicht schnell, die Ausnahme nach § 312g Abs. 2 BGB
      greift also nicht: 14-tägiges Widerrufsrecht gilt.
- [ ] **AGB für Verbraucher** — die bestehenden sind ausdrücklich nur für Geschäftskunden.
- [ ] **Button-Lösung** (§ 312j BGB) — der Bestellbutton muss „Zahlungspflichtig bestellen"
      heißen. Stripe Checkout erledigt das, wenn die Locale korrekt gesetzt ist.
- [ ] **Grundpreis** (€/kg) im Warenkorb und im Checkout, nicht nur auf der Produktseite.
- [ ] **Versandkosten vor Bestellabschluss** — auflösen, welche der drei
      widersprüchlichen Aussagen gilt (siehe `audit.md`, Abschnitt 3).
- [ ] Korrekten Steuersatz je Produkt vom Steuerberater bestätigen lassen (7 % vs. 19 %).

---

---

## Anhang — im Live-Checkout geprüft (2026-09-20)

Direkt im Wix-Checkout nachgesehen, statt zu raten:

**Aktive Zahlungsarten — drei, nicht zwei:**

| Methode                | Status   |
| ---------------------- | -------- |
| Kredit-/Debitkarte     | ✅ aktiv |
| PayPal                 | ✅ aktiv |
| Apple Pay              | ✅ aktiv |
| SEPA-Lastschrift       | ❌ fehlt |
| Klarna / Rechnungskauf | ❌ fehlt |

Kartenzahlung ist also vorhanden — die Vermutung, Android- und Windows-Nutzer könnten
nur über PayPal bezahlen, hat sich **nicht** bestätigt. Es fehlen aber SEPA-Lastschrift
und Rechnungskauf, zusammen rund ein Drittel der Zahlungspräferenzen im deutschen
E-Commerce. Beide sind im neuen Shop reine Konfiguration.

**Weiterer Fund:** Im Checkout steht bei der Lieferung **„Nicht verfügbar"**, solange
keine Adresse eingegeben ist, und die Gesamtsumme entspricht exakt der Zwischensumme.
Das kann normales Verhalten vor der Adresseingabe sein — oder ein Hinweis auf nicht
sauber konfigurierte Versandzonen. **Sollte im Wix-Backend verifiziert werden**, weil es
zur Versandkosten-Unklarheit aus dem Audit passt.

**Offen geblieben:** Beim Test lag ein Artikel im Warenkorb, der nicht zur aufgerufenen
Produktseite passte (1-kg-Seite angeklickt, im Warenkorb lag der 5-kg-Artikel).
Wahrscheinlich Altbestand aus der Browser-Sitzung — **nicht verifiziert**.
Vor dem Relaunch einmal sauber im Inkognito-Fenster gegenprüfen: Wenn die
1-kg-Produktseite tatsächlich den falschen Artikel in den Warenkorb legt, wäre das
ein aktiver Umsatzfehler.

---

## Zusammengefasst

1. **B2B braucht kein Payment.** Formular, Datensatz, Mail — das Geld läuft wie bisher
   über Rechnung und Überweisung.
2. **B2C ist ein kleiner Shop mit 6 Artikeln.** Stripe übernimmt Bezahlseite, PCI, SCA,
   Steuerberechnung, Rechnungen und Auszahlung.
3. **Wir bauen:** Warenkorb, einen Checkout-Endpunkt, einen Webhook, eine Bestellübersicht,
   zwei E-Mail-Vorlagen.
4. **Der einzige echte Fallstrick** ist, Preise serverseitig aus der Datenbank zu lesen
   und Bestellungen im Webhook anzulegen. Beides bekannte Muster.
