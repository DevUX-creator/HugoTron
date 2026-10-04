/**
 * What the contact form gets back from the enquiry action. Kept outside the "use server" file,
 * which may only export async functions. `error` is a MESSAGE KEY: the client owns the language.
 */
export type EnquiryState = {
  ok: boolean;
  error?: "errorEmail" | "errorLong" | "errorRate" | "errorGeneric";
  /** What the visitor typed, returned with an error: React resets the form after every action. */
  values?: Record<string, string>;
};

export const ENQUIRY_INITIAL_STATE: EnquiryState = { ok: false };
