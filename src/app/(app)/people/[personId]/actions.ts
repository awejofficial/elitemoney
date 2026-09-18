"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LendingDirection } from "@/lib/supabase/database.types";

function parseEntryForm(formData: FormData) {
  const direction = String(formData.get("direction") ?? "lent") as LendingDirection;
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0." } as const;
  if (!date) return { error: "Pick a date." } as const;

  return {
    error: null,
    values: {
      direction,
      amount,
      date,
      due_date: dueDate || null,
      note: note || null,
    },
  } as const;
}

export async function createLendingEntry(personId: string, formData: FormData) {
  const parsed = parseEntryForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("lending_entries").insert({
    user_id: user.id,
    person_id: personId,
    ...parsed.values,
  });

  if (error) return { error: error.message };

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  return { error: null };
}

export async function updateLendingEntry(personId: string, entryId: string, formData: FormData) {
  const parsed = parseEntryForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("lending_entries").update(parsed.values).eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  return { error: null };
}

export async function deleteLendingEntry(personId: string, entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lending_entries").delete().eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  return { error: null };
}

export async function addRepayment(personId: string, entryId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0." };
  if (!date) return { error: "Pick a date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("lending_repayments").insert({
    user_id: user.id,
    lending_entry_id: entryId,
    amount,
    date,
  });

  if (error) return { error: error.message };

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  return { error: null };
}
