import { round2 } from "../finance";
import { toISODate } from "../format";
import type { Account, Couple, Investment, InvestmentKind, Profile, Scope, Transaction } from "../types";
import type { Repo } from "./types";

// Modo demonstração: dados fictícios em memória, gerados a partir da data de hoje.
// Tudo o que for criado aqui some quando o servidor reinicia.

interface StoredAccount extends Account {
  ownerId: string | null;
}
interface StoredTransaction extends Omit<Transaction, "scope" | "createdByName"> {
  createdBy: string;
}
interface StoredInvestment extends Omit<Investment, "scope"> {
  ownerId: string | null;
}

interface DemoStore {
  users: Profile[];
  couple: Omit<Couple, "members"> & { memberIds: string[] };
  accounts: StoredAccount[];
  transactions: StoredTransaction[];
  investments: StoredInvestment[];
}

export const DEMO_USERS: Profile[] = [
  { id: "demo-carlos", name: "Carlos", email: "carlos@demo.app" },
  { id: "demo-parceira", name: "Parceira", email: "parceira@demo.app" },
];

const globalForDemo = globalThis as unknown as { __demoStore?: DemoStore };

function store(): DemoStore {
  globalForDemo.__demoStore ??= seed(new Date());
  return globalForDemo.__demoStore;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let nextId = 1;
const id = (prefix: string) => `${prefix}-${nextId++}`;

export function seed(today: Date): DemoStore {
  const rand = mulberry32(42);
  const between = (min: number, max: number) => round2(min + rand() * (max - min));
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const [carlos, parceira] = DEMO_USERS;

  const acc = (name: string, brand: string, last4: string, ownerId: string | null, initialBalance: number): StoredAccount => ({
    id: id("acc"),
    name,
    brand,
    last4,
    ownerId,
    scope: ownerId ? "pessoal" : "casal",
    initialBalance,
  });

  const carlosMain = acc("Nubank", "mastercard", "4821", carlos!.id, 3200);
  const carlosSecond = acc("Itaú", "visa", "1290", carlos!.id, 5400);
  const parceiraMain = acc("Inter", "mastercard", "7731", parceira!.id, 2800);
  const parceiraSecond = acc("C6 Bank", "visa", "0042", parceira!.id, 1500);
  const joint = acc("Conta do Casal", "visa", "5566", null, 4000);

  const transactions: StoredTransaction[] = [];
  const investments: StoredInvestment[] = [];
  const tx = (accountId: string, createdBy: string, date: Date, description: string, category: string, amount: number) => {
    if (date > today) return;
    transactions.push({ id: id("tx"), accountId, createdBy, occurredAt: toISODate(date), description, category, amount: round2(amount) });
  };
  const inv = (ownerId: string | null, date: Date, kind: InvestmentKind, name: string, amount: number) => {
    if (date > today) return;
    investments.push({ id: id("inv"), ownerId, investedAt: toISODate(date), kind, name, amount: round2(amount) });
    // O dinheiro aplicado sai da conta principal de quem investiu.
    const from = ownerId === carlos!.id ? carlosMain : ownerId === parceira!.id ? parceiraMain : joint;
    tx(from.id, ownerId ?? carlos!.id, date, `Aplicação: ${name}`, "investimentos", -amount);
  };

  const personalExpenses = [
    ["Uber", "transporte", 18, 60],
    ["iFood", "restaurantes", 35, 95],
    ["Farmácia", "saúde", 25, 140],
    ["Spotify", "assinaturas", 21.9, 21.9],
    ["Academia", "saúde", 119.9, 119.9],
    ["Amazon", "compras", 45, 320],
    ["Cinema", "lazer", 40, 90],
    ["Posto Shell", "transporte", 120, 260],
    ["Renner", "compras", 80, 380],
  ] as const;

  for (let i = 12; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const day = (d: number) => new Date(month.getFullYear(), month.getMonth(), d);

    for (const [user, main, second, salary] of [
      [carlos!, carlosMain, carlosSecond, 7200],
      [parceira!, parceiraMain, parceiraSecond, 6400],
    ] as const) {
      tx(main.id, user.id, day(5), "Salário", "salário", salary);
      tx(main.id, user.id, day(6), "Transferência para a conta do casal", "moradia", -3200);
      tx(joint.id, user.id, day(6), `Aporte de ${user.name}`, "moradia", 3200);
      const count = 6 + Math.floor(rand() * 5);
      for (let k = 0; k < count; k++) {
        const [desc, cat, min, max] = pick(personalExpenses);
        tx(rand() < 0.6 ? main.id : second.id, user.id, day(1 + Math.floor(rand() * 27)), desc, cat, -between(min, max));
      }
      if (rand() < 0.35) tx(second.id, user.id, day(20), "Freela / extra", "salário", between(400, 1500));

      inv(user.id, day(7), "renda_fixa", pick(["CDB 110% CDI", "Tesouro IPCA+ 2035", "LCI 95% CDI"]), between(400, 900));
      if (rand() < 0.6) inv(user.id, day(15), "renda_variavel", pick(["BOVA11", "ITUB4", "WEGE3", "IVVB11", "PETR4"]), between(200, 700));
    }

    tx(joint.id, carlos!.id, day(10), "Aluguel", "moradia", -2800);
    tx(joint.id, parceira!.id, day(12), "Condomínio + luz", "moradia", -between(520, 680));
    tx(joint.id, carlos!.id, day(15), "Internet Vivo Fibra", "assinaturas", -119.9);
    tx(joint.id, parceira!.id, day(15), "Netflix", "assinaturas", -55.9);
    for (const d of [3, 11, 18, 25]) {
      tx(joint.id, rand() < 0.5 ? carlos!.id : parceira!.id, day(d), pick(["Carrefour", "Pão de Açúcar", "Assaí", "Feira"]), "mercado", -between(180, 460));
    }
    for (let k = 0; k < 2 + Math.floor(rand() * 3); k++) {
      tx(joint.id, rand() < 0.5 ? carlos!.id : parceira!.id, day(1 + Math.floor(rand() * 27)), pick(["Jantar fora", "Outback", "Pizzaria", "Sushi"]), "restaurantes", -between(90, 280));
    }
    inv(null, day(8), "renda_fixa", "Reserva de emergência (Tesouro Selic)", between(500, 800));
    if (i % 3 === 0) inv(null, day(20), "renda_fixa", "Viagem dos sonhos (CDB)", between(300, 600));
  }

  return {
    users: DEMO_USERS,
    couple: { id: "demo-couple", name: "Carlos & Parceira", inviteCode: "DEMO2026", memberIds: DEMO_USERS.map((u) => u.id) },
    accounts: [carlosMain, carlosSecond, parceiraMain, parceiraSecond, joint],
    transactions,
    investments,
  };
}

export function createDemoRepo(userId: string): Repo | null {
  const s = store();
  const me = s.users.find((u) => u.id === userId);
  if (!me) return null;
  const inCouple = s.couple.memberIds.includes(me.id);

  const visibleAccount = (a: StoredAccount) => a.ownerId === me.id || (a.ownerId === null && inCouple);
  const scopeOf = (ownerId: string | null): Scope => (ownerId ? "pessoal" : "casal");
  const nameOf = (uid: string) => s.users.find((u) => u.id === uid)?.name ?? null;

  return {
    me,
    async getCouple() {
      if (!inCouple) return null;
      const { memberIds, ...couple } = s.couple;
      return { ...couple, members: s.users.filter((u) => memberIds.includes(u.id)) };
    },
    async listAccounts() {
      return s.accounts.filter(visibleAccount).map(({ ownerId, ...a }) => (void ownerId, a));
    },
    async listTransactions() {
      const accounts = new Map(s.accounts.filter(visibleAccount).map((a) => [a.id, a]));
      return s.transactions
        .filter((t) => accounts.has(t.accountId))
        .map(({ createdBy, ...t }) => ({ ...t, scope: accounts.get(t.accountId)!.scope, createdByName: nameOf(createdBy) }))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },
    async listInvestments() {
      return s.investments
        .filter((i) => i.ownerId === me.id || (i.ownerId === null && inCouple))
        .map(({ ownerId, ...i }) => ({ ...i, scope: scopeOf(ownerId) }))
        .sort((a, b) => b.investedAt.localeCompare(a.investedAt));
    },
    async createAccount(input) {
      const { scope, ...rest } = input;
      s.accounts.push({ id: id("acc"), ...rest, scope, ownerId: scope === "pessoal" ? me.id : null });
    },
    async createTransaction(input) {
      const account = s.accounts.find((a) => a.id === input.accountId);
      if (!account || !visibleAccount(account)) throw new Error("Conta não encontrada.");
      s.transactions.push({ id: id("tx"), createdBy: me.id, ...input });
    },
    async deleteTransaction(txId) {
      const accounts = new Set(s.accounts.filter(visibleAccount).map((a) => a.id));
      s.transactions = s.transactions.filter((t) => !(t.id === txId && accounts.has(t.accountId)));
    },
    async createInvestment(input) {
      const { scope, ...rest } = input;
      s.investments.push({ id: id("inv"), ...rest, ownerId: scope === "pessoal" ? me.id : null });
    },
    async deleteInvestment(invId) {
      s.investments = s.investments.filter((i) => !(i.id === invId && (i.ownerId === me.id || (i.ownerId === null && inCouple))));
    },
    async createCouple() {
      throw new Error("No modo demonstração o casal já está configurado.");
    },
    async joinCouple() {
      throw new Error("No modo demonstração o casal já está configurado.");
    },
  };
}
