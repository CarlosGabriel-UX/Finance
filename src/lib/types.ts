export type Scope = "pessoal" | "casal";
export type ScopeFilter = Scope | "tudo";
export type InvestmentKind = "renda_fixa" | "renda_variavel";

export interface Profile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface Couple {
  id: string;
  name: string;
  inviteCode: string;
  members: Profile[];
}

export interface Account {
  id: string;
  name: string;
  brand: string;
  last4: string | null;
  scope: Scope;
  initialBalance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  category: string;
  /** Positivo = entrada, negativo = saída. */
  amount: number;
  /** Data no formato YYYY-MM-DD. */
  occurredAt: string;
  scope: Scope;
  createdByName: string | null;
}

export interface Investment {
  id: string;
  kind: InvestmentKind;
  name: string;
  amount: number;
  investedAt: string;
  scope: Scope;
}

export interface NewAccount {
  name: string;
  brand: string;
  last4: string | null;
  scope: Scope;
  initialBalance: number;
}

export interface NewTransaction {
  accountId: string;
  description: string;
  category: string;
  amount: number;
  occurredAt: string;
}

export interface NewInvestment {
  kind: InvestmentKind;
  name: string;
  amount: number;
  investedAt: string;
  scope: Scope;
}

export const CATEGORIES = [
  "salário",
  "moradia",
  "mercado",
  "restaurantes",
  "transporte",
  "lazer",
  "saúde",
  "assinaturas",
  "compras",
  "viagem",
  "investimentos",
  "outros",
] as const;
