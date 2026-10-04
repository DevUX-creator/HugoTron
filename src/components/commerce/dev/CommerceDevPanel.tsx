"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  setGuestCheckout,
  setPaymentOutcome,
  signInDemo,
  signOutDemo,
} from "@/commerce/dev/actions";
import "./devPanel.css";

/**
 * The backend team's switcher (development and staging only; see DEV_TOOLS in commerce/config).
 * It flips the scenarios a checkout must handle without editing code: a guest or the signed-in
 * demo customer, guest checkout allowed or account required, payment accepted or declined.
 * Deliberately in English and unstyled beyond the essentials: it is a tool, not part of the site.
 */
export default function CommerceDevPanel({
  signedIn,
  allowGuest,
  payment,
}: {
  signedIn: string | null;
  allowGuest: boolean;
  payment: "success" | "fail";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const run = (action: () => Promise<void>) =>
    start(async () => {
      await action();
      router.refresh();
    });
  return (
    <aside className="dev-panel" data-open={open || undefined} aria-label="Commerce dev tools">
      <button type="button" className="dev-panel__toggle" onClick={() => setOpen(!open)}>
        DEV · {signedIn ? "signed in" : "guest"} · {payment}
      </button>
      {open && (
        <div className="dev-panel__body" aria-busy={pending}>
          <p className="dev-panel__title">Customer</p>
          <div className="dev-panel__row">
            <button type="button" aria-pressed={!signedIn} onClick={() => run(signOutDemo)}>
              Guest
            </button>
            <button type="button" aria-pressed={Boolean(signedIn)} onClick={() => run(signInDemo)}>
              Demo customer
            </button>
          </div>
          {signedIn && <p className="dev-panel__note">{signedIn}</p>}
          <p className="dev-panel__title">Guest checkout</p>
          <div className="dev-panel__row">
            <button
              type="button"
              aria-pressed={allowGuest}
              onClick={() => run(() => setGuestCheckout(true))}
            >
              Allowed
            </button>
            <button
              type="button"
              aria-pressed={!allowGuest}
              onClick={() => run(() => setGuestCheckout(false))}
            >
              Account required
            </button>
          </div>
          <p className="dev-panel__title">Payment provider answers</p>
          <div className="dev-panel__row">
            <button
              type="button"
              aria-pressed={payment === "success"}
              onClick={() => run(() => setPaymentOutcome("success"))}
            >
              Success
            </button>
            <button
              type="button"
              aria-pressed={payment === "fail"}
              onClick={() => run(() => setPaymentOutcome("fail"))}
            >
              Declined
            </button>
          </div>
          <p className="dev-panel__note">
            Mock data: demo@hugo-tron.test / demo1234 · vouchers WELCOME10, FREESHIP. See
            docs/handoff/INTEGRATION.md.
          </p>
        </div>
      )}
    </aside>
  );
}
