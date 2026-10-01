import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import ContactFooter from "@/components/layout/ContactFooter";
import Section from "@/components/ui/Section";
import SectionTag from "@/components/ui/SectionTag";
import Heading from "@/components/ui/Heading";
import { COMPANY, CONTACT, HREF } from "@/content/site";
import "./formPage.css";

/**
 * The page around a form (enquiry, order request). The column on the left keeps a real address
 * and a person who answers in view for the whole length of the form, so a buyer who stalls
 * halfway always has another way to reach Hugo Tron.
 */
export default async function FormPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  const contact = await getTranslations("homeStory.contact");
  return (
    <>
      <div id="top" />
      <AnnouncementBar />
      <Header />
      <main>
        <Section width="wide" className="form-page" ariaLabel={title}>
          <div className="form-page__layout">
            <div className="form-page__intro">
              <SectionTag>{eyebrow}</SectionTag>
              <Heading as={1} size="hero-lg" className="form-page__title">
                {title}
              </Heading>
              <p className="form-page__lead">{lead}</p>
              <address className="form-page__address">
                <span>{COMPANY.legalName}</span>
                <span>{COMPANY.street}</span>
                <span>
                  {COMPANY.postalCode} {COMPANY.city}, {contact("country")}
                </span>
                <a href={HREF.email}>{CONTACT.email}</a>
                <a href={HREF.phone}>{CONTACT.phoneDisplay}</a>
              </address>
            </div>
            <div>{children}</div>
          </div>
        </Section>
      </main>
      <ContactFooter />
    </>
  );
}
