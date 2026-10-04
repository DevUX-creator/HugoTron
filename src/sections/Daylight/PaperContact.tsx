"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMPANY, CONTACT, HREF } from "@/content/site";
import { getCategories } from "@/commerce/catalogue";
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
  const law = useTranslations("legal");
  return (
    <footer
      className="paper-contact"
      data-story-chapter="contact"
      data-line="85,0.02;78,0.18;94,0.5;95,0.8;88,1.03"
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
            <ArrowLink href="/contact" prefetch={false} variant="glass">
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
              <Link href="/wholesale" prefetch={false}>
                {nav("wholesale")}
              </Link>
            </li>
            <li>
              <Link href="/private-label" prefetch={false}>
                {nav("privateLabel")}
              </Link>
            </li>
            <li>
              <Link href="/contact" prefetch={false}>
                {t("enquiry")}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="paper-contact__reach">
          <h3>{nav("contact")}</h3>
          {/* The quick ways to reach Hugo Tron, as on the current hugo-tron.com footer. */}
          <a href={HREF.whatsapp} target="_blank" rel="noreferrer">
            <span className="paper-contact__channel">WhatsApp</span> {CONTACT.whatsappDisplay}
          </a>
          <a href={HREF.email}>
            <span className="paper-contact__channel">{t("email")}</span> {CONTACT.email}
          </a>
          <a href={HREF.phone}>
            <span className="paper-contact__channel">{t("phone")}</span> {CONTACT.phoneDisplay}
          </a>
          <a href={HREF.instagram} target="_blank" rel="noreferrer">
            <span className="paper-contact__channel">Instagram</span> @{CONTACT.instagram}
          </a>
          <Link href="/contact" prefetch={false} className="paper-contact__form">
            {t("form")}
          </Link>
          <p className="paper-caption">
            {COMPANY.city} → {t("europe")}
          </p>
        </div>
      </div>
      <div className="paper-contact__bottom">
        <span>
          © {new Date().getFullYear()} {COMPANY.legalName}
        </span>
        <nav aria-label={t("legalNav")}>
          <Link href="/terms" prefetch={false}>
            {legal("terms")}
          </Link>
          <Link href="/privacy" prefetch={false}>
            {legal("privacy")}
          </Link>
          <Link href="/imprint" prefetch={false}>
            {legal("imprint")}
          </Link>
          {/* Member of the Händlerbund, as on the live hugo-tron.com footer. A badge, not a
              link: every link on the site leads to Hugo Tron's own pages and channels. */}
          <span className="paper-contact__member">
            <Image src="/badges/haendlerbund.png" alt={law("member")} width={238} height={144} />
          </span>
        </nav>
        <a href="#top">{t("back")} ↑</a>
      </div>
    </footer>
  );
}
