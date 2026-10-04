"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateAddress, type FormState } from "@/commerce/account/actions";
import type { AddressInput } from "@/commerce/checkout/schema";
import AddressFields, { EMPTY_ADDRESS } from "../checkout/AddressFields";
import StatusMessage from "../feedback/StatusMessage";

/** The customer's delivery address, editable in the account. */
export default function AddressForm({ address }: { address: AddressInput | null }) {
  const t = useTranslations("commerce.account");
  const errors = useTranslations("commerce.errors");
  const notices = useTranslations("commerce.notices");
  const [state, action, pending] = useActionState<FormState, FormData>(updateAddress, {
    status: "idle",
  });
  const value = { ...EMPTY_ADDRESS, ...address, ...(state.values as Partial<AddressInput>) };
  return (
    <form action={action} className="account-form">
      {state.status === "ok" && (
        <StatusMessage tone="success" compact title={notices("addressSaved")} />
      )}
      {state.status === "error" && state.message && (
        <StatusMessage
          tone="error"
          compact
          title={errors(state.message as Parameters<typeof errors>[0])}
        />
      )}
      {/* Keyed by the result, so a saved form shows the saved values. */}
      <AddressFields key={state.status} section="shipping" value={value} />
      <button type="submit" className="commerce-button" disabled={pending} aria-busy={pending}>
        {pending ? t("saving") : t("saveAddress")}
      </button>
    </form>
  );
}
