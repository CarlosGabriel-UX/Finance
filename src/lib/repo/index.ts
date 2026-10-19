import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemo } from "../config";
import { createClient } from "../supabase/server";
import { createDemoRepo } from "./demo";
import { DEMO_COOKIE } from "./demo-session";
import { createSupabaseRepo } from "./supabase";
import type { Repo } from "./types";

export type { Repo } from "./types";

export async function getRepo(): Promise<Repo | null> {
  if (isDemo) {
    const userId = (await cookies()).get(DEMO_COOKIE)?.value;
    return userId ? createDemoRepo(userId) : null;
  }
  return createSupabaseRepo(await createClient());
}

/** Para páginas e actions que exigem login. */
export async function requireRepo(): Promise<Repo> {
  const repo = await getRepo();
  if (!repo) redirect("/login");
  return repo;
}
