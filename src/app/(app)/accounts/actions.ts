"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/supabase/database.types";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "bank") as AccountType;
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) return { error: "Name is required." };
  if (Number.isNaN(startingBalance)) return { error: "Starting balance must be a number." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    starting_balance: startingBalance,
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { error: null };
}

export async function updateAccount(accountId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "bank") as AccountType;
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) return { error: "Name is required." };
  if (Number.isNaN(startingBalance)) return { error: "Starting balance must be a number." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name, type, starting_balance: startingBalance })
    .eq("id", accountId);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { error: null };
}

export async function deleteAccount(accountId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { error: null };
}
