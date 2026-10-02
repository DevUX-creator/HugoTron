import { useTranslations } from "next-intl";
import BrandLogo from "@/components/layout/BrandLogo";

/** Folded paper and three ink states; no additional 3D renderer or model. */
export default function PaperPack({ settled = false }: { settled?: boolean }) {
  const t = useTranslations("paperStory.label");
  return (
    <div className="paper-pack" data-settled={settled || undefined} aria-hidden="true">
      <div className="paper-pack__body">
        <div className="paper-pack__seam" />
        <div className="paper-pack__stamp paper-pack__stamp--hugo">
          <BrandLogo />
          <span>{t("ingredient")}</span>
        </div>
        <div className="paper-pack__stamp paper-pack__stamp--yours">
          <span className="paper-pack__cross">+</span>
          <strong>{t("yourLogo")}</strong>
          <span>{t("possibility")}</span>
        </div>
        <svg className="paper-pack__grain" viewBox="0 0 100 100" fill="none">
          <path
            d="M36 94Q61 47 51 8M45 67Q17 66 23 42Q48 45 45 67M50 49Q73 48 77 22Q53 25 50 49M51 29Q29 29 31 10Q47 9 51 29"
            stroke="currentColor"
          />
        </svg>
        <div className="paper-pack__fold" />
      </div>
      <span className="paper-pack__shadow" />
    </div>
  );
}
