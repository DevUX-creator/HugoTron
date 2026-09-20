import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/* eslint-config-next 16 ships native flat configs, so no FlatCompat shim. */
const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      /* next/image is mandatory — the reference project shipped 15 raw <img>
         tags against a dead images config. See docs/ASSETS.md. */
      "@next/next/no-img-element": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      /* Locale-aware navigation only. Importing next/link or the next/navigation
         hooks directly bypasses the translated pathname map and emits
         untranslated URLs — see docs/I18N.md. */
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message: "Import Link from '@/i18n/navigation' so locale prefixes are applied.",
            },
            {
              name: "next/navigation",
              importNames: ["redirect", "permanentRedirect", "useRouter", "usePathname"],
              message: "Import these from '@/i18n/navigation' so locale prefixes are applied.",
            },
          ],
        },
      ],
    },
  },
  {
    /* The navigation module is the one place allowed to touch next/* directly. */
    files: ["src/i18n/navigation.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "raw/**",
      /* The client's reference drop. It is a whole second Next app checked in
         beside ours to be READ, not built — a different framework version, its
         own lint rules and none of ours. Linting it reports eight hundred
         problems in code nobody here will ever edit. */
      "CGMWTAUGUST2026/**",
      "playwright-report/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
