import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, Investment, Profile, Scope, Transaction } from "../types";
import type { Repo } from "./types";

const PAGE = 1000;

/** Busca todas as linhas, paginando (o PostgREST limita a 1000 por requisição). */
async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const scopeOf = (ownerId: string | null): Scope => (ownerId ? "pessoal" : "casal");

export async function createSupabaseRepo(supabase: SupabaseClient): Promise<Repo | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("id, name, avatar_url").eq("id", user.id).maybeSingle();
  const me: Profile = {
    id: user.id,
    name: profile?.name ?? user.email?.split("@")[0] ?? "Você",
    email: user.email,
    avatarUrl: profile?.avatar_url ?? null,
  };

  async function coupleId(): Promise<string | null> {
    const { data, error } = await supabase.from("couple_members").select("couple_id").eq("user_id", me.id).maybeSingle();
    check(error);
    return data?.couple_id ?? null;
  }

  return {
    me,
    async getCouple() {
      const id = await coupleId();
      if (!id) return null;
      const { data: couple, error } = await supabase.from("couples").select("id, name, invite_code").eq("id", id).single();
      check(error);
      if (!couple) return null;
      const { data: members } = await supabase.from("couple_members").select("user_id").eq("couple_id", id);
      const ids = (members ?? []).map((m) => m.user_id as string);
      const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url").in("id", ids);
      return {
        id: couple.id,
        name: couple.name,
        inviteCode: couple.invite_code,
        members: (profiles ?? []).map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatar_url })),
      };
    },
    async listAccounts() {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, brand, last4, owner_id, initial_balance")
        .order("created_at");
      check(error);
      return (data ?? []).map(
        (a): Account => ({
          id: a.id,
          name: a.name,
          brand: a.brand,
          last4: a.last4,
          scope: scopeOf(a.owner_id),
          initialBalance: Number(a.initial_balance),
        }),
      );
    },
    async listTransactions() {
      type Row = {
        id: string;
        account_id: string;
        description: string;
        category: string;
        amount: string | number;
        occurred_at: string;
        created_by: string | null;
        accounts: { owner_id: string | null } | null;
      };
      const rows = await fetchAll<Row>((from, to) =>
        supabase
          .from("transactions")
          .select("id, account_id, description, category, amount, occurred_at, created_by, accounts(owner_id)")
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false })
          .range(from, to)
          .returns<Row[]>(),
      );
      const { data: profiles } = await supabase.from("profiles").select("id, name");
      const names = new Map((profiles ?? []).map((p) => [p.id as string, p.name as string]));
      return rows.map(
        (t): Transaction => ({
          id: t.id,
          accountId: t.account_id,
          description: t.description,
          category: t.category,
          amount: Number(t.amount),
          occurredAt: t.occurred_at,
          scope: scopeOf(t.accounts?.owner_id ?? null),
          createdByName: t.created_by ? (names.get(t.created_by) ?? null) : null,
        }),
      );
    },
    async listInvestments() {
      type Row = { id: string; kind: Investment["kind"]; name: string; amount: string | number; invested_at: string; owner_id: string | null };
      const rows = await fetchAll<Row>((from, to) =>
        supabase
          .from("investments")
          .select("id, kind, name, amount, invested_at, owner_id")
          .order("invested_at", { ascending: false })
          .range(from, to)
          .returns<Row[]>(),
      );
      return rows.map((i) => ({
        id: i.id,
        kind: i.kind,
        name: i.name,
        amount: Number(i.amount),
        investedAt: i.invested_at,
        scope: scopeOf(i.owner_id),
      }));
    },
    async createAccount(input) {
      const owner = await ownerColumns(input.scope);
      const { error } = await supabase.from("accounts").insert({
        name: input.name,
        brand: input.brand,
        last4: input.last4,
        initial_balance: input.initialBalance,
        ...owner,
      });
      check(error);
    },
    async createTransaction(input) {
      const { error } = await supabase.from("transactions").insert({
        account_id: input.accountId,
        description: input.description,
        category: input.category,
        amount: input.amount,
        occurred_at: input.occurredAt,
      });
      check(error);
    },
    async deleteTransaction(id) {
      check((await supabase.from("transactions").delete().eq("id", id)).error);
    },
    async createInvestment(input) {
      const owner = await ownerColumns(input.scope);
      const { error } = await supabase.from("investments").insert({
        kind: input.kind,
        name: input.name,
        amount: input.amount,
        invested_at: input.investedAt,
        ...owner,
      });
      check(error);
    },
    async deleteInvestment(id) {
      check((await supabase.from("investments").delete().eq("id", id)).error);
    },
    async createCouple(name) {
      check((await supabase.rpc("create_couple", { p_name: name })).error);
    },
    async joinCouple(code) {
      check((await supabase.rpc("join_couple", { p_code: code })).error);
    },
  };

  async function ownerColumns(scope: Scope) {
    if (scope === "pessoal") return { owner_id: me.id, couple_id: null };
    const id = await coupleIdOrThrow();
    return { owner_id: null, couple_id: id };
  }

  async function coupleIdOrThrow() {
    const { data } = await supabase.from("couple_members").select("couple_id").eq("user_id", me.id).maybeSingle();
    if (!data?.couple_id) throw new Error("Conecte-se ao seu par na página Casal antes de criar itens do casal.");
    return data.couple_id as string;
  }
}
