import Image from "next/image";
import { useTranslations } from "next-intl";
import SectionTag from "@/components/ui/SectionTag";
import Heading from "@/components/ui/Heading";
import ArrowLink from "@/components/ui/ArrowLink";
import { Link } from "@/i18n/navigation";
import Copy from "@/animations/Copy";
import { COMPANY, CONTACT, HREF } from "@/content/site";
import FooterProducts from "./FooterProducts";
import "./contactFooter.css";

/** Every page the site has, in the order the menu lists them. */
const FOOTER_SITE = [
  { href: "/range", key: "range" },
  { href: "/wholesale", key: "wholesale" },
  { href: "/private-label", key: "privateLabel" },
  { href: "/about", key: "about" },
  { href: "/delivery", key: "delivery" },
  { href: "/contact", key: "contact" },
] as const;

/** The Händlerbund legal service supplies all four — see the badge below. */
const FOOTER_LEGAL = [
  { href: "/terms", key: "terms" },
  { href: "/withdrawal", key: "withdrawal" },
  { href: "/privacy", key: "privacy" },
  { href: "/imprint", key: "imprint" },
] as const;

export default function ContactFooter() {
  const t = useTranslations("homeStory.contact");
  const nav = useTranslations("nav");
  const menu = useTranslations("menu");
  return (
    <footer className="home-footer" id="contact">
      <div className="container-wide">
        <div className="home-footer__top">
          <div>
            <SectionTag>{t("eyebrow")}</SectionTag>
            <Copy>
              <Heading as={2} size="hero-xl">
                {t("title")}
              </Heading>
            </Copy>
          </div>
          <div className="home-footer__action">
            <Copy>
              <p>{t("lead")}</p>
            </Copy>
            <ArrowLink href="/enquiry">{t("cta")}</ArrowLink>
          </div>
        </div>
        <FooterProducts />
        <div className="home-footer__info">
          <div className="home-footer__identity">
            <a href="#top" className="home-footer__brand" aria-label={nav("home")}>
              <Image src="/brand/logo.png" alt="Hugo Tron" width={132} height={100} />
            </a>

            {/* MITGLIED IM HÄNDLERBUND. Not decoration and not ours to invent:
                the badge is on the live site today (content/strategy/audit.md
                §e), and it is the reason the legal column beside it can be
                trusted — the Händlerbund legal service writes those texts,
                keeps them current through changes in the law, and carries the
                liability for them. Worth saying out loud rather than leaving
                as a logo nobody reads. */}
            <div className="home-footer__member">
              <Image src="/badges/haendlerbund.png" alt={t("memberAlt")} width={238} height={144} />
              <p>{t("memberNote")}</p>
            </div>
          </div>

          <div className="home-footer__reach">
            <address>
              <span>{COMPANY.legalName}</span>
              <span>{COMPANY.street}</span>
              <span>
                {COMPANY.postalCode} {COMPANY.city}, {t("country")}
              </span>
            </address>
            <div className="home-footer__contacts">
              <a href={HREF.email}>{CONTACT.email}</a>
              <a href={HREF.phone}>{CONTACT.phoneDisplay}</a>
            </div>
          </div>

          {/* EVERY PAGE, AS PAGES. The old list mixed four anchors into this
              one document, so a reader on any other page got a footer that
              navigated nowhere. These are routes — see i18n/routing.ts, which
              translates each one per locale. */}
          <nav className="home-footer__nav" aria-label={t("navigation")}>
            <p className="home-footer__nav-label">{t("navSite")}</p>
            <ul>
              {FOOTER_SITE.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{nav(item.key)}</Link>
                </li>
              ))}
              <li>
                <Link href="/enquiry">{t("enquiry")}</Link>
              </li>
            </ul>
          </nav>

          <nav className="home-footer__nav" aria-label={t("navLegal")}>
            <p className="home-footer__nav-label">{t("navLegal")}</p>
            <ul>
              {FOOTER_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{menu(item.key)}</Link>
                </li>
              ))}
              {/* TODO(consent): there is no consent manager on the site yet, so
                  "Cookies" points at the privacy notice, where the cookie
                  section lives. The day a banner exists, this becomes the
                  control that reopens it — a link that cannot reopen the
                  choice is not a cookie setting. */}
              <li>
                <Link href="/privacy">{t("cookies")}</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="home-footer__bottom">
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}
          </span>
          <span>{t("signoff")}</span>
          <a href="#top">{t("backTop")} ↑</a>
        </div>
      </div>
    </footer>
  );
}
