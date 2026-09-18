"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType } from "@/lib/supabase/database.types";

function parseTransactionForm(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const type = String(formData.get("type") ?? "expense") as CategoryType;
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!accountId) return { error: "Pick an account." } as const;
  if (!categoryId) return { error: "Pick a category." } as const;
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0." } as const;
  if (!date) return { error: "Pick a date." } as const;

  return {
    error: null,
    values: {
      account_id: accountId,
      category_id: categoryId,
      type,
      amount,
      date,
      note: note || null,
    },
  } as const;
}

export async function createTransaction(formData: FormData) {
  const parsed = parseTransactionForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    ...parsed.values,
  });

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null };
}

export async function updateTransaction(transactionId: string, formData: FormData) {
  const parsed = parseTransactionForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(parsed.values)
    .eq("id", transactionId);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null };
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null };
}
