import { useTranslations } from "next-intl";
import { COMPANY, CONTACT, HREF } from "@/content/site";

/** The fast ways to reach Hugo Tron: WhatsApp, email, phone, Instagram and the address. */
export default function QuickContact() {
  const t = useTranslations("contact.quick");
  const channels = [
    { key: "whatsapp", href: HREF.whatsapp, value: CONTACT.whatsappDisplay, external: true },
    { key: "email", href: HREF.email, value: CONTACT.email, external: false },
    { key: "phone", href: HREF.phone, value: CONTACT.phoneDisplay, external: false },
    { key: "instagram", href: HREF.instagram, value: `@${CONTACT.instagram}`, external: true },
  ] as const;
  return (
    <div className="quick-contact">
      <ul>
        {channels.map((channel) => (
          <li key={channel.key}>
            <a
              href={channel.href}
              {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <span className="quick-contact__label">{t(channel.key)}</span>
              <span className="quick-contact__value">{channel.value}</span>
            </a>
          </li>
        ))}
      </ul>
      <address>
        <span className="quick-contact__label">{t("address")}</span>
        <span>{COMPANY.legalName}</span>
        <span>{COMPANY.street}</span>
        <span>
          {COMPANY.postalCode} {COMPANY.city}
        </span>
      </address>
      <p>{t("response")}</p>
    </div>
  );
}
