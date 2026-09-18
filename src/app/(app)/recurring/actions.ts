"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeNextRunDate } from "@/lib/recurring";
import type { CategoryType } from "@/lib/supabase/database.types";

function parseRuleForm(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const type = String(formData.get("type") ?? "expense") as CategoryType;
  const amount = Number(formData.get("amount") ?? 0);
  const dayOfMonth = Number(formData.get("day_of_month") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!accountId) return { error: "Pick an account." } as const;
  if (!categoryId) return { error: "Pick a category." } as const;
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0." } as const;
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: "Day of month must be between 1 and 31." } as const;
  }

  return {
    error: null,
    values: {
      account_id: accountId,
      category_id: categoryId,
      type,
      amount,
      day_of_month: dayOfMonth,
      frequency: "monthly" as const,
      note: note || null,
    },
  } as const;
}

export async function createRecurringRule(formData: FormData) {
  const parsed = parseRuleForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("recurring_rules").insert({
    user_id: user.id,
    ...parsed.values,
    next_run_date: computeNextRunDate(parsed.values.day_of_month),
    active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { error: null };
}

export async function updateRecurringRule(ruleId: string, formData: FormData) {
  const parsed = parseRuleForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .update({
      ...parsed.values,
      next_run_date: computeNextRunDate(parsed.values.day_of_month),
    })
    .eq("id", ruleId);

  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { error: null };
}

export async function toggleRecurringRuleActive(ruleId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .update({ active })
    .eq("id", ruleId);

  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { error: null };
}

export async function deleteRecurringRule(ruleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_rules").delete().eq("id", ruleId);

  if (error) return { error: error.message };

  revalidatePath("/recurring");
  return { error: null };
}
