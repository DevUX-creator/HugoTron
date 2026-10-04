import type { Locale } from "@/i18n/routing";
import type { LegalDocument } from "./types";

/**
 * Return policy / right of withdrawal (food): the text supplied by the client (October 2026),
 * in English as supplied; the German version is a translation of it. Below it, the online
 * withdrawal function (§ 356a BGB).
 */
export function withdrawal(locale: Locale): LegalDocument {
  const de = locale === "de";
  return {
    title: de
      ? "Rückgabe / Widerrufsrecht (Lebensmittel)"
      : "Return Policy / Right of Withdrawal (Food)",
    source: "Supplied by the client (English); German translation",
    blocks: de
      ? [
          { h2: "Kein Widerrufsrecht für Lebensmittel" },
          {
            p: "Beim Kauf von Lebensmitteln besteht kein Widerrufsrecht, da es sich um Waren handelt, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, sofern sie versiegelt geliefert wurden und die Versiegelung nach der Lieferung entfernt wurde.",
          },
          { h2: "Ausnahmen" },
          { p: "Eine Rückgabe oder ein Umtausch ist nur in folgenden Fällen möglich:" },
          {
            list: [
              "Die Ware wurde falsch geliefert.",
              "Die Ware ist bei Ankunft beschädigt.",
              "Es liegt ein nachweisbarer Qualitätsmangel vor.",
            ],
          },
          {
            p: "In diesen Fällen bitten wir Sie, uns umgehend, spätestens jedoch 48 Stunden nach Erhalt der Ware, mit Foto- oder Videonachweis zu kontaktieren.",
          },
          { h2: "Rücksendungen" },
          {
            p: "Geöffnete oder teilweise verbrauchte Lebensmittel sind von der Rückgabe ausgeschlossen. Rücksendungen ohne vorherige Kontaktaufnahme können nicht angenommen werden. Die Kosten der Rücksendung werden nur bei berechtigten Reklamationen übernommen.",
          },
          { h2: "Vertrag widerrufen", id: "widerrufen" },
          { slot: "withdrawal" },
        ]
      : [
          { h2: "No Right of Withdrawal for Food" },
          {
            p: "There is no right of withdrawal for the purchase of food products, as these are goods that are unsuitable for return for reasons of health protection or hygiene, provided they were delivered sealed and the seal has been broken after delivery.",
          },
          { h2: "Exceptions" },
          { p: "A return or exchange is only possible in the following cases:" },
          {
            list: [
              "The goods were delivered incorrectly.",
              "The goods are damaged upon arrival.",
              "There is a demonstrable quality defect.",
            ],
          },
          {
            p: "In these cases, we ask you to contact us immediately, but no later than 48 hours after receiving the goods, with photo or video evidence.",
          },
          { h2: "Returns" },
          {
            p: "Opened or partially used food products are excluded from return. Returns without prior contact cannot be accepted. Return shipping costs will only be covered for justified complaints.",
          },
          { h2: "Withdraw from contract", id: "widerrufen" },
          { slot: "withdrawal" },
        ],
  };
}
