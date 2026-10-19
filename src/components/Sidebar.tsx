"use client";

import { ArrowLeftRight, HeartHandshake, Home, LineChart, LogOut, PiggyBank, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/", label: "Início", icon: Home },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/contas", label: "Contas e cartões", icon: Wallet },
  { href: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { href: "/mercado", label: "Quando investir", icon: LineChart },
  { href: "/casal", label: "Casal", icon: HeartHandshake },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] w-[76px] shrink-0 flex-col items-center gap-2 !rounded-[28px] !px-3 py-5 md:flex">
      <Link href="/" className="mb-4 border-b border-white/10 pb-4" aria-label="Início">
        <Logo />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                active ? "bg-accent text-white shadow-[0_8px_24px_-8px_rgba(240,122,42,0.8)]" : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
      <form action={signOut}>
        <button title="Sair" aria-label="Sair" className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted hover:bg-white/5 hover:text-ink">
          <LogOut size={20} />
        </button>
      </form>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-3xl border border-line bg-panel/95 p-2 backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-accent text-white" : "text-muted"}`}
          >
            <Icon size={20} />
          </Link>
        );
      })}
    </nav>
  );
}
