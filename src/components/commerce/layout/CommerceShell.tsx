import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SiteFooter from "@/components/layout/SiteFooter";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import { DEV_TOOLS } from "@/commerce/config";
import { readDevSettings } from "@/commerce/dev/settings";
import { getSession } from "@/commerce/session";
import CommerceDevPanel from "../dev/CommerceDevPanel";
import "./commerceShell.css";

/**
 * The page around every commerce screen (products, cart, checkout, account): the story's light
 * paper, the home's columns and clouds barely visible behind, the header and the footer with
 * its quick contacts and legal links (the home's footer), and the delivery strip at the top.
 * In development it also carries the backend switcher.
 */
export default async function CommerceShell({
  children,
  label,
}: {
  children: ReactNode;
  /** The main region's name when the page has no visible h1 of its own. */
  label?: string;
}) {
  const t = await getTranslations("commerce");
  const dev = DEV_TOOLS ? { session: await getSession(), settings: await readDevSettings() } : null;
  return (
    <HomeThemeProvider forcedTheme="light">
      <div id="top" />
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Header brandLogo showSoundToggle={false} />
      <div className="commerce-paper" aria-hidden="true">
        <Image
          className="commerce-paper__column commerce-paper__column--left"
          src="/images/paper-world/source-column.webp"
          alt=""
          width={720}
          height={1080}
          priority={false}
        />
        <Image
          className="commerce-paper__column commerce-paper__column--right"
          src="/images/paper-world/source-column.webp"
          alt=""
          width={720}
          height={1080}
        />
        <Image
          className="commerce-paper__cloud"
          src="/images/paper-world/source-cloud.webp"
          alt=""
          width={1200}
          height={480}
        />
      </div>
      <main id="main" tabIndex={-1} className="commerce" aria-label={label}>
        <AnnouncementBar />
        {children}
      </main>
      <SiteFooter />
      {dev && (
        <CommerceDevPanel
          signedIn={dev.session?.customer.email ?? null}
          allowGuest={dev.settings.allowGuest}
          payment={dev.settings.payment}
        />
      )}
    </HomeThemeProvider>
  );
}
