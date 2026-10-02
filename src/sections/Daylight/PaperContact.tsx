"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMPANY, CONTACT, HREF } from "@/content/site";
import { getCategories } from "@/lib/catalogue";
import ArrowLink from "@/components/ui/ArrowLink";
import BrandLogo from "@/components/layout/BrandLogo";
import PaperPortal from "./PaperPortal";

const CATEGORIES = getCategories();

export default function PaperContact() {
  const t = useTranslations("paperStory.contact");
  const range = useTranslations("paperStory.range");
  const nav = useTranslations("nav");
  const categories = useTranslations("world");
  const legal = useTranslations("menu");
  return (
    <footer
      className="paper-contact"
      data-story-chapter="contact"
      data-line="85,0.02;58,0.3"
      id="contact"
      aria-labelledby="paper-contact-title"
    >
      <div className="paper-contact__hero">
        <PaperPortal />
        <div className="paper-contact__copy">
          <p className="paper-caption">{t("eyebrow")}</p>
          <h2 id="paper-contact-title">{t("title")}</h2>
          <div className="paper-contact__actions">
            <ArrowLink href="/range" prefetch={false} size="large" variant="glass">
              {range("action")}
            </ArrowLink>
            <ArrowLink href="/enquiry" prefetch={false} variant="glass">
              {t("action")}
            </ArrowLink>
          </div>
        </div>
      </div>
      <div className="paper-contact__info">
        <div className="paper-contact__company">
          <a href="#top" aria-label={nav("home")} className="paper-contact__brand">
            <BrandLogo />
          </a>
          <address>
            <strong>{COMPANY.legalName}</strong>
            <span>{COMPANY.street}</span>
            <span>
              {COMPANY.postalCode} {COMPANY.city}
            </span>
            <span>{t("country")}</span>
          </address>
        </div>
        <nav aria-label={t("productsNav")} className="paper-contact__nav">
          <h3>{nav("range")}</h3>
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link href={category.href} prefetch={false}>
                  {categories(category.id)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("businessNav")} className="paper-contact__nav">
          <h3>{t("business")}</h3>
          <ul>
            <li>
              <Link href={{ pathname: "/enquiry", query: { purpose: "quote" } }} prefetch={false}>
                {nav("wholesale")}
              </Link>
            </li>
            <li>
              <Link href="/private-label" prefetch={false}>
                {nav("privateLabel")}
              </Link>
            </li>
            <li>
              <Link href="/enquiry" prefetch={false}>
                {t("enquiry")}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="paper-contact__reach">
          <h3>{nav("contact")}</h3>
          <a href={HREF.email}>{CONTACT.email}</a>
          <a href={HREF.phone}>{CONTACT.phoneDisplay}</a>
          <p className="paper-caption">
            {COMPANY.city} → {t("europe")}
          </p>
        </div>
      </div>
      <div className="paper-contact__bottom">
        <span>
          © {new Date().getFullYear()} {COMPANY.legalName}
        </span>
        {/* Existing published notices until dedicated legal pages are migrated. */}
        <nav aria-label={t("legalNav")}>
          <a href="https://www.hugo-tron.com/datenschutz">{legal("privacy")}</a>
          <a href="https://www.hugo-tron.com/impressum">{legal("imprint")}</a>
        </nav>
        <a href="#top">{t("back")} ↑</a>
      </div>
    </footer>
  );
}
