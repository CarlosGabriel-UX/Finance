"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemo } from "@/lib/config";
import { DEMO_USERS } from "@/lib/repo/demo";
import { DEMO_COOKIE } from "@/lib/repo/demo-session";
import { createClient } from "@/lib/supabase/server";

function back(params: Record<string, string>): never {
  redirect(`/login?${new URLSearchParams(params)}`);
}

export async function signIn(formData: FormData) {
  if (isDemo) {
    const userId = String(formData.get("demoUser") ?? "");
    if (!DEMO_USERS.some((u) => u.id === userId)) back({ erro: "Escolha um usuário de demonstração." });
    (await cookies()).set(DEMO_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
    redirect("/");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) back({ erro: "E-mail ou senha incorretos." });
  redirect("/");
}

export async function signUp(formData: FormData) {
  if (isDemo) back({ erro: "Cadastro indisponível no modo demonstração." });

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name) back({ modo: "cadastro", erro: "Informe seu nome." });
  if (password.length < 8) back({ modo: "cadastro", erro: "A senha precisa ter pelo menos 8 caracteres." });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) back({ modo: "cadastro", erro: error.message });
  if (!data.session) back({ ok: "Conta criada! Confirme seu e-mail e depois entre." });
  redirect("/casal");
}

export async function signOut() {
  if (isDemo) {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    await (await createClient()).auth.signOut();
  }
  redirect("/login");
}
