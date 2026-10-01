import de from "../../messages/de.json";
import en from "../../messages/en.json";

/** German is the source of truth for the message shape — see i18n/routing.ts. */
export type Messages = typeof de;

/**
 * Type-level parity guard.
 *
 * If `messages/en.json` is missing any key that exists in `messages/de.json`,
 * this `satisfies` fails and `pnpm typecheck` errors — a translation gap can
 * never reach production as a silently-rendered raw key.
 */
void (en satisfies Messages);
