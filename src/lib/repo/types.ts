import type { Account, Couple, Investment, NewAccount, NewInvestment, NewTransaction, Profile, Transaction } from "../types";

/** Acesso aos dados da pessoa logada (pessoal + casal). */
export interface Repo {
  me: Profile;
  getCouple(): Promise<Couple | null>;
  listAccounts(): Promise<Account[]>;
  listTransactions(): Promise<Transaction[]>;
  listInvestments(): Promise<Investment[]>;
  createAccount(input: NewAccount): Promise<void>;
  createTransaction(input: NewTransaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  createInvestment(input: NewInvestment): Promise<void>;
  deleteInvestment(id: string): Promise<void>;
  createCouple(name: string): Promise<void>;
  joinCouple(code: string): Promise<void>;
}
