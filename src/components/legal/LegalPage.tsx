import type { Locale } from "@/i18n/routing";
import { getSession } from "@/commerce/session";
import type { LegalPageId } from "@/content/legal/types";
import { legalDocument } from "@/lib/legal/source";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import LegalBlocks from "./LegalBlocks";
import WithdrawalFunction from "./WithdrawalFunction";
import "./legal.css";

/**
 * Every legal page: title, an optional language note, then the text's blocks (and, on the
 * withdrawal page, the withdrawal function).
 */
export default async function LegalPage({
  page,
  locale,
  orderReference = "",
}: {
  page: LegalPageId;
  locale: Locale;
  orderReference?: string;
}) {
  const document = legalDocument(page, locale);
  const session = page === "withdrawal" ? await getSession() : null;
  return (
    <CommerceShell>
      <article className="legal" lang={locale}>
        <header className="legal__head">
          <h1>{document.title}</h1>
          {document.translationNote && <p className="legal__note">{document.translationNote}</p>}
        </header>
        <div className="legal__body">
          <LegalBlocks
            blocks={document.blocks}
            slot={
              <WithdrawalFunction
                orderReference={orderReference}
                email={session?.customer.email ?? ""}
                name={session ? `${session.customer.firstName} ${session.customer.lastName}` : ""}
              />
            }
          />
        </div>
      </article>
    </CommerceShell>
  );
}
