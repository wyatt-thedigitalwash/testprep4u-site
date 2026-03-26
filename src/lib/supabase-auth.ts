import { createClient } from "./supabase/client";

// ── Browser-side auth helpers ──
// All functions use the browser Supabase client.
// For server-side session checks, use createServerSupabaseClient directly.

export async function login(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user, error };
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
  state: string,
  redirectTo?: string
) {
  const supabase = createClient();
  let emailRedirectTo = `${window.location.origin}/auth/callback`;
  if (redirectTo) {
    emailRedirectTo += `?next=${encodeURIComponent(redirectTo)}`;
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, state },
      emailRedirectTo,
    },
  });
  return { user: data.user, error };
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });
  return { error };
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}
