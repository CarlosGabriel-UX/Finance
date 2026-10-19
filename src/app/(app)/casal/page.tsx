import { Avatar } from "@/components/Avatar";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { requireRepo } from "@/lib/repo";
import { createCouple, joinCouple } from "../actions";

export default async function CouplePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const repo = await requireRepo();
  const couple = await repo.getCouple();

  return (
    <div className="space-y-4">
      <PageHeader title="Casal" subtitle="Cada um tem seu login e sua tela. O que for do casal aparece para os dois." />
      <Flash error={params.erro} ok={params.ok} />

      {couple ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="panel-accent">
            <h2 className="text-2xl font-semibold">{couple.name}</h2>
            <ul className="mt-5 space-y-3">
              {couple.members.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} index={i} />
                  <span>
                    {m.name}
                    {m.id === repo.me.id && <span className="ml-2 text-sm text-white/60">(você)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel space-y-3">
            {couple.members.length < 2 ? (
              <>
                <h2 className="text-lg">Convide seu par</h2>
                <p className="text-sm text-muted">Peça para ela criar a conta dela e informar este código na página Casal:</p>
                <p className="rounded-2xl border border-dashed border-accent/60 bg-accent/10 py-4 text-center font-mono text-3xl tracking-[0.3em] text-accent">
                  {couple.inviteCode}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg">Como funciona</h2>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
                  <li>Contas e investimentos marcados como “Pessoal” só aparecem para quem criou.</li>
                  <li>Itens do “Casal” aparecem para os dois, com o nome de quem lançou cada transação.</li>
                  <li>Use o seletor Tudo / Pessoal / Casal no topo para trocar a visão.</li>
                </ul>
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="panel">
            <h2 className="mb-1 text-lg">Criar nosso casal</h2>
            <p className="mb-4 text-sm text-muted">Você recebe um código para enviar ao seu par.</p>
            <form action={createCouple} className="space-y-3">
              <div>
                <label className="label" htmlFor="name">Nome do casal</label>
                <input className="input" id="name" name="name" placeholder="Ex.: Nós dois" />
              </div>
              <button className="btn-primary w-full">Criar e gerar código</button>
            </form>
          </section>
          <section className="panel">
            <h2 className="mb-1 text-lg">Já tenho um código</h2>
            <p className="mb-4 text-sm text-muted">Digite o código que seu par te enviou.</p>
            <form action={joinCouple} className="space-y-3">
              <div>
                <label className="label" htmlFor="code">Código de convite</label>
                <input className="input font-mono uppercase tracking-widest" id="code" name="code" required maxLength={12} />
              </div>
              <button className="btn-ghost w-full">Entrar no casal</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
