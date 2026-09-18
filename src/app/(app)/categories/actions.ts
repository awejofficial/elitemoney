"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType } from "@/lib/supabase/database.types";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "expense") as CategoryType;
  const icon = String(formData.get("icon") ?? "💰").trim() || "💰";
  const color = String(formData.get("color") ?? "#0d9488");

  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type,
    icon,
    color,
    is_system: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/categories");
  return { error: null };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "");

  if (!name) return { error: "Name is required." };
  if (!icon) return { error: "Icon is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, icon, color })
    .eq("id", categoryId);

  if (error) return { error: error.message };

  revalidatePath("/categories");
  return { error: null };
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Can't delete — this category has transactions using it.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { error: null };
}
