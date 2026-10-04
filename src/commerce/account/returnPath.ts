/** Never allow untrusted return paths to resolve outside this origin. */
export function safeReturn(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/")) return null;
  if (/^[\/]{2}|[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  const path = value.split(/[?#]/, 1)[0]!;
  if (/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f|25)/i.test(path)) return null;
  try {
    const url = new URL(value, "https://return.invalid");
    return url.origin === "https://return.invalid" ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
}
