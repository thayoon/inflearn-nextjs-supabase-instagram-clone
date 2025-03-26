"use server";

import {
  createServerSupabaseAdminClient,
  createServerSupabaseClient,
} from "utils/supabase/server";

export async function getAllUsers() {
  const supabase = await createServerSupabaseAdminClient();

  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.log(error);
    return [];
  }

  return users;
}

export async function getUserById(userId: string) {
  const supabase = await createServerSupabaseAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    return null;
  }

  return user;
}
