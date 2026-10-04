"use server";

import { z } from "zod";
import { withinRateLimit } from "@/lib/rateLimit";
import { backend } from "../backend";
import type { WithdrawalReceipt } from "../types";

/**
 * The online withdrawal function's confirmation step ("Widerruf bestätigen", § 356a BGB).
 * The form collects name, order and email first and shows them for review; this action then
 * hands the declaration to the backend, which emails the acknowledgement of receipt.
 */
const declaration = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.email().max(320),
  orderReference: z.string().trim().min(1).max(60),
  items: z.string().trim().max(1000),
  locale: z.string().max(12),
});

export type WithdrawalResult =
  | { ok: true; receipt: WithdrawalReceipt }
  | { ok: false; error: "invalid" | "rateLimited" | "generic" };

export async function submitWithdrawal(input: unknown): Promise<WithdrawalResult> {
  const parsed = declaration.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await withinRateLimit("withdrawal"))) return { ok: false, error: "rateLimited" };
  try {
    return { ok: true, receipt: await backend().withdrawals.submit(parsed.data) };
  } catch (cause) {
    console.error("[commerce] withdrawal failed", cause);
    return { ok: false, error: "generic" };
  }
}
