import { Search } from "lucide-react";
import { Suspense } from "react";
import type { Profile } from "@/lib/types";
import { Avatar } from "./Avatar";
import { ScopeTabs } from "./ScopeTabs";

export function Topbar({ me, coupleName, demo }: { me: Profile; coupleName: string | null; demo: boolean }) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <form action="/transacoes" className="flex w-full min-w-0 items-center gap-3 rounded-full sm:w-auto sm:flex-1 border border-white/10 bg-white/5 px-4 py-2.5 sm:max-w-md">
        <Search size={18} className="text-muted" />
        <input
          name="q"
          placeholder="Buscar transações"
          aria-label="Buscar transações"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </form>
      <Suspense>
        <ScopeTabs />
      </Suspense>
      <div className="ml-auto flex items-center gap-3">
        {demo && <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">Demonstração</span>}
        <Avatar name={me.name} size={42} />
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">{me.name}</p>
          <p className="text-xs text-muted">{coupleName ?? me.email}</p>
        </div>
      </div>
    </header>
  );
}
