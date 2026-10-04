/** Payment return URLs must not silently point to localhost in a deployed environment. */
export function siteOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value && process.env.NODE_ENV !== "production") return "http://localhost:3000";
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL is required for commerce; see docs/handoff.");
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  )
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin in production.");
  return url.origin;
}
