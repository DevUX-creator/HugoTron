/** Environment checks only. Real-provider and business sign-off: docs/handoff/OPEN-ITEMS.md. */
const problems = [];
const env = process.env;
if (!env.COMMERCE_BACKEND || env.COMMERCE_BACKEND === "mock")
  problems.push("Register/select a real COMMERCE_BACKEND.");
if (!env.ENQUIRY_PROVIDER || ["console", "smtp"].includes(env.ENQUIRY_PROVIDER))
  problems.push(
    "Register/select a working ENQUIRY_PROVIDER; console and the current smtp stub do not deliver.",
  );
for (const name of [
  "COMMERCE_ALLOW_MOCK",
  "ENQUIRY_ALLOW_CONSOLE",
  "NEXT_PUBLIC_COMMERCE_DEV_TOOLS",
]) {
  if (env[name] === "true") problems.push(`${name} must not be enabled for live commerce.`);
}
if (Buffer.byteLength(env.COMMERCE_COOKIE_SECRET ?? "") < 32)
  problems.push("Set a random COMMERCE_COOKIE_SECRET of at least 32 bytes.");
try {
  const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error();
} catch {
  problems.push("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without path/query/credentials.");
}
if (!["x-real-ip", "x-forwarded-for"].includes(env.RATE_LIMIT_IP_HEADER))
  problems.push(
    "Configure a trusted, overwritten RATE_LIMIT_IP_HEADER and review distributed limits.",
  );
if (problems.length) {
  console.error(
    "Live commerce configuration is incomplete:\n" + problems.map((item) => `- ${item}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "Environment shape passed. This does not validate adapter registration, credentials, quotes, stock, email delivery or launch approval. Complete docs/handoff/OPEN-ITEMS.md.",
  );
}
