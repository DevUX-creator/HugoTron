import { getTranslations } from "next-intl/server";
import type { ContactTopic } from "@/lib/enquiry/schema";
import ContactForm from "./ContactForm";
import QuickContact from "./QuickContact";
import "./contact.css";

/** Contact, in the account's style: quick ways to reach us beside one form with topics. */
export default async function ContactPage(props: {
  topic: ContactTopic;
  purpose: "quote" | "sample" | "label" | "other";
  product: string;
  packSize: string;
  email: string;
  name: string;
}) {
  const t = await getTranslations("contact");
  return (
    <div className="contact">
      <header className="contact__head">
        <p className="commerce-caption">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <div className="contact__layout">
        <aside className="contact__aside" aria-label={t("quickLabel")}>
          <QuickContact />
        </aside>
        <div className="contact__panel commerce-panel">
          <ContactForm {...props} />
        </div>
      </div>
    </div>
  );
}
