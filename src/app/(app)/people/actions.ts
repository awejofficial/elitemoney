"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPerson(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("people").insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath("/people");
  return { error: null };
}

export async function updatePerson(personId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("people").update({ name }).eq("id", personId);
  if (error) return { error: error.message };

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  return { error: null };
}

export async function deletePerson(personId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("id", personId);
  if (error) return { error: error.message };

  revalidatePath("/people");
  return { error: null };
}
