# Cookies, browser storage and legal pages

Checked 5 October 2026. This is an implementation inventory for handoff, not legal approval.

## Current visitor experience

`src/components/legal/CookieNotice.tsx` shows a compact, non-modal storage notice in German
and English. It links to privacy, terms and imprint. “Understood” only dismisses the notice;
it does not accept terms or grant permission for analytics, advertising or third parties.
Dismissal survives reloads. Restricted storage still allows dismissal for the current visit.
The component does not load any third-party code and does not lock scrolling or steal focus.

No analytics/ad trackers or external video/map embeds are configured in the current app.
Do not use `hugo.storage-notice.v1` as a consent flag. If integrations introduce optional
storage/tracking, implement consent before enabling those integrations: block them until an
applicable choice, provide accept/reject/preferences and a persistent way to change or
withdraw the choice. Review the actual providers and purposes with the client's adviser.

## Storage currently used

| Name                        | Mechanism        | Purpose / current retention                                                       |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `NEXT_LOCALE`               | next-intl cookie | Language preference; default session lifetime                                     |
| `ht_session`                | HttpOnly cookie  | Requested sign-in; up to 30 days, deleted on sign-out                             |
| `ht_oauth_attempt`          | HttpOnly cookie  | Bind an initiated social sign-in to the browser; 10 minutes, consumed on callback |
| `ht_last_order`             | HttpOnly cookie  | Signed access to the latest guest order; 24 hours                                 |
| `hugo.cart.v1`              | localStorage     | Cart product IDs, quantities, voucher and note; updated/cleared by cart actions   |
| `hugo-sound-enabled`        | localStorage     | User's sound choice                                                               |
| `hugo.home-theme`           | localStorage     | User's light/dark theme choice                                                    |
| `hugo.delivery.controls.v1` | localStorage     | Remember that the visitor used the driving controls                               |
| `hugo:arrival`              | sessionStorage   | Door transition handoff; removed by the arrival scene                             |
| `hugo.storage-notice.v1`    | localStorage     | Remember notice dismissal; no visitor identifier or consent grant                 |

localStorage entries currently have no automatic expiry; browser clearing removes them.
Development commerce controls also set preview cookies; dev controls must remain off in
production. Inventory the chosen hosting, payment, auth and other providers again on staging,
including their cookies and retention. Confirm legal classification and retention with the
client; this inventory does not declare every item exempt from consent.

## Existing documents and remaining approval

- Terms: `/de/agb`, `/en/terms`. Existing German **business-customer terms**, also shown in
  the English route with a language note. Consumer checkout still needs appropriate approval.
- Privacy: `/de/datenschutz`, `/en/privacy`. Inherited live-site text still names **Wix**.
  Replace it with approved text reflecting the actual deployed services before launch.
- Imprint: `/de/impressum`, `/en/imprint`.
- Withdrawal: `/de/widerruf`, `/en/withdrawal`.

These routes already have permanent menu/footer links. Content lives in `src/content/legal/`
and is loaded through `src/lib/legal/source.ts`. Do not invent replacement legal terms or
silently certify inherited wording. [CLIENT-INPUT.md](CLIENT-INPUT.md) and items C02/D06 in
[OPEN-ITEMS.md](OPEN-ITEMS.md) remain launch requirements.

## Reference for the review

Consent requirements and the strictly necessary/requested-service exceptions are in
[TDDDG §25](https://www.gesetze-im-internet.de/ttdsg/__25.html). A notice dismissal is not a
substitute for any required consent. The deployment and actual services determine the final
implementation and policy wording.
