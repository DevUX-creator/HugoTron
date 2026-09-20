/**
 * Gate for text entrances.
 *
 * In the reference project this waited for a branded loading curtain to open.
 * Hugo Tron has no curtain (yet), so this resolves immediately — but the hook
 * stays, because every animation wrapper already awaits it. If an intro
 * sequence is added later, set `data-curtain` on <html> and dispatch
 * `hugo:page-reveal` when it finishes; nothing else needs to change.
 *
 * Bounded independently so animation setup still works if a provider fails.
 */
export function waitForPageReveal(): Promise<void> {
  const state = document.documentElement.dataset["curtain"];
  if (!state || state === "reveal") return Promise.resolve();

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timeout);
      window.removeEventListener("hugo:page-reveal", done);
      resolve();
    };
    const timeout = setTimeout(done, 2600);
    window.addEventListener("hugo:page-reveal", done, { once: true });
  });
}
