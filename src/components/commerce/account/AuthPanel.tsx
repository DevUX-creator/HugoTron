"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { register, requestPasswordReset, signIn, type FormState } from "@/commerce/account/actions";
import StatusMessage from "../feedback/StatusMessage";
import SocialButtons from "./SocialButtons";

type Mode = "signin" | "register" | "reset";
const IDLE: FormState = { status: "idle" };

/**
 * Sign in, create an account, or reset a password, with social sign-in alongside. `returnTo`
 * brings the visitor back where they were (checkout, an order) after signing in.
 */
export default function AuthPanel({
  initialMode,
  returnTo,
  email,
}: {
  initialMode: Mode;
  returnTo: string;
  email: string;
}) {
  const t = useTranslations("commerce.account");
  const [mode, setMode] = useState<Mode>(initialMode);
  return (
    <div className="auth">
      <header className="auth__head">
        <h1>
          {t(
            mode === "register" ? "registerTitle" : mode === "reset" ? "resetTitle" : "signInTitle",
          )}
        </h1>
        <p>
          {t(mode === "register" ? "registerLead" : mode === "reset" ? "resetLead" : "signInLead")}
        </p>
      </header>
      {mode !== "reset" && (
        <div className="auth__tabs" role="tablist" aria-label={t("modeLabel")}>
          {(["signin", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => setMode(tab)}
            >
              {t(tab === "signin" ? "signInTab" : "registerTab")}
            </button>
          ))}
        </div>
      )}
      <div className="auth__panel commerce-panel">
        {mode === "signin" && (
          <SignInForm returnTo={returnTo} email={email} onForgot={() => setMode("reset")} />
        )}
        {mode === "register" && <RegisterForm returnTo={returnTo} email={email} />}
        {mode === "reset" && <ResetForm email={email} onBack={() => setMode("signin")} />}
        {mode !== "reset" && (
          <div className="auth__social">
            <p className="commerce-caption">{t("orContinueWith")}</p>
            <SocialButtons returnTo={returnTo} />
          </div>
        )}
      </div>
    </div>
  );
}

function Feedback({ state }: { state: FormState }) {
  const errors = useTranslations("commerce.errors");
  const notices = useTranslations("commerce.notices");
  if (state.status === "idle" || !state.message) return null;
  return state.status === "ok" ? (
    <StatusMessage
      tone="success"
      compact
      title={notices(state.message as Parameters<typeof notices>[0])}
    />
  ) : (
    <StatusMessage
      tone="error"
      compact
      title={errors(state.message as Parameters<typeof errors>[0])}
    />
  );
}

function SignInForm({
  returnTo,
  email,
  onForgot,
}: {
  returnTo: string;
  email: string;
  onForgot: () => void;
}) {
  const t = useTranslations("commerce.account");
  const [state, action, pending] = useActionState(signIn, IDLE);
  return (
    <form action={action} className="account-form">
      <Feedback state={state} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="commerce-field">
        <label htmlFor="signin-email">{t("email")}</label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email ?? email}
        />
      </div>
      <div className="commerce-field">
        <label htmlFor="signin-password">{t("password")}</label>
        <input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button type="button" className="commerce-link auth__forgot" onClick={onForgot}>
        {t("forgot")}
      </button>
      <button
        type="submit"
        className="commerce-button commerce-button--block"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}

function RegisterForm({ returnTo, email }: { returnTo: string; email: string }) {
  const t = useTranslations("commerce.account");
  const [state, action, pending] = useActionState(register, IDLE);
  return (
    <form action={action} className="account-form">
      <Feedback state={state} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="commerce-fields">
        <div className="commerce-field">
          <label htmlFor="register-first">{t("firstName")}</label>
          <input
            id="register-first"
            name="firstName"
            autoComplete="given-name"
            required
            defaultValue={state.values?.firstName}
          />
        </div>
        <div className="commerce-field">
          <label htmlFor="register-last">{t("lastName")}</label>
          <input
            id="register-last"
            name="lastName"
            autoComplete="family-name"
            required
            defaultValue={state.values?.lastName}
          />
        </div>
      </div>
      <div className="commerce-field">
        <label htmlFor="register-email">{t("email")}</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email ?? email}
        />
      </div>
      <div className="commerce-field">
        <label htmlFor="register-password">{t("password")}</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby="register-password-hint"
        />
        <span id="register-password-hint" className="commerce-field__hint">
          {t("passwordHint")}
        </span>
      </div>
      <button
        type="submit"
        className="commerce-button commerce-button--block"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? t("creating") : t("register")}
      </button>
    </form>
  );
}

function ResetForm({ email, onBack }: { email: string; onBack: () => void }) {
  const t = useTranslations("commerce.account");
  const [state, action, pending] = useActionState(requestPasswordReset, IDLE);
  return (
    <form action={action} className="account-form">
      <Feedback state={state} />
      <div className="commerce-field">
        <label htmlFor="reset-email">{t("email")}</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email ?? email}
        />
      </div>
      <button
        type="submit"
        className="commerce-button commerce-button--block"
        disabled={pending}
        aria-busy={pending}
      >
        {t("sendReset")}
      </button>
      <button type="button" className="commerce-link auth__forgot" onClick={onBack}>
        {t("backToSignIn")}
      </button>
    </form>
  );
}
