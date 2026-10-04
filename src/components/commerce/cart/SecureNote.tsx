import { useTranslations } from "next-intl";

/** "Secure checkout", with the accepted payment methods, under every checkout button. */
export default function SecureNote() {
  const t = useTranslations("commerce.cart");
  const pay = useTranslations("commerce.payment.methods");
  return (
    <div className="secure-note">
      <p>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" fill="none" stroke="currentColor" />
        </svg>
        {t("secure")}
      </p>
      <ul aria-label={t("methodsLabel")}>
        {(["card", "paypal", "applePay", "klarna", "prepayment"] as const).map((method) => (
          <li key={method}>{pay(`${method}.short`)}</li>
        ))}
      </ul>
    </div>
  );
}
