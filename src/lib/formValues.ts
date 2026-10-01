/**
 * What a buyer typed into a public form, to send back with an error. React resets a form after
 * every server action, so without this a single mistake would empty every field. The bot trap
 * and framework fields are never echoed back.
 */
export function typedValues(
  formData: FormData,
  skip: readonly string[] = [],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value !== "string" || key.startsWith("$") || key === "company_website") continue;
    if (!skip.includes(key)) values[key] = value;
  }
  return values;
}
