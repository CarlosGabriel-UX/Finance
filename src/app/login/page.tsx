import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Flash } from "@/components/Flash";
import { Logo } from "@/components/Logo";
import { isDemo } from "@/lib/config";
import { getRepo } from "@/lib/repo";
import { DEMO_USERS } from "@/lib/repo/demo";
import { signIn, signUp } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await getRepo()) redirect("/");
  const { erro, ok, modo } = await searchParams;
  const signup = modo === "cadastro";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md space-y-6 p-8">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-semibold">Finanças do Casal</h1>
            <p className="text-sm text-muted">Sua vida financeira e a de vocês dois, juntas.</p>
          </div>
        </div>

        <Flash error={erro} ok={ok} />

        {isDemo ? (
          <form action={signIn} className="space-y-3">
            <p className="text-sm text-muted">
              Modo demonstração (sem banco configurado). Escolha quem vai entrar para ver a tela de cada um:
            </p>
            {DEMO_USERS.map((u, i) => (
              <button key={u.id} name="demoUser" value={u.id} className="btn-ghost w-full justify-start py-3">
                <Avatar name={u.name} size={32} index={i} />
                Entrar como {u.name}
              </button>
            ))}
          </form>
        ) : (
          <form action={signup ? signUp : signIn} className="space-y-4">
            {signup && (
              <div>
                <label className="label" htmlFor="name">Nome</label>
                <input className="input" id="name" name="name" required autoComplete="name" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input className="input" id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Senha</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                minLength={signup ? 8 : undefined}
                autoComplete={signup ? "new-password" : "current-password"}
              />
            </div>
            <button className="btn-primary w-full">{signup ? "Criar conta" : "Entrar"}</button>
            <p className="text-center text-sm text-muted">
              {signup ? "Já tem conta? " : "Ainda não tem conta? "}
              <Link className="text-accent hover:underline" href={signup ? "/login" : "/login?modo=cadastro"}>
                {signup ? "Entrar" : "Criar conta"}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
