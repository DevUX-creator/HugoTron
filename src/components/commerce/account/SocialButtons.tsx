"use client";

import { useTranslations } from "next-intl";
import { socialSignIn } from "@/commerce/account/actions";
import { COMMERCE } from "@/commerce/config";

/** "Continue with Google / Apple". Each button posts to the backend's social sign-in. */
export default function SocialButtons({ returnTo }: { returnTo: string }) {
  const t = useTranslations("commerce.account");
  return (
    <div className="social-buttons">
      {COMMERCE.social.map((provider) => (
        <form key={provider} action={socialSignIn.bind(null, provider, returnTo)}>
          <button
            type="submit"
            className="commerce-button commerce-button--ghost commerce-button--block"
          >
            <span className="social-buttons__mark" data-provider={provider} aria-hidden="true" />
            {t(`social.${provider}`)}
          </button>
        </form>
      ))}
    </div>
  );
}
