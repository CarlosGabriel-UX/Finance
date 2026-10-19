# Finanças do Casal

App web para acompanhar as finanças de um casal: cada pessoa tem seu próprio login e sua própria tela, com a vida financeira **pessoal** e a **do casal** no mesmo lugar, além de um termômetro de **quando investir** em renda fixa e renda variável.

## O que tem

- **Início**: saldo total com gráfico (1 ano, 6, 3 ou 1 mês), contas e cartões, transações recentes, aportes por mês e o termômetro do mercado.
- **Visão Tudo / Pessoal / Casal** no topo de todas as telas.
- **Transações**: lançar entradas e saídas, buscar e excluir. Em contas do casal aparece quem lançou.
- **Contas e cartões**: pessoais (só você vê) ou do casal (os dois veem).
- **Investimentos**: aportes em renda fixa e variável, pessoais ou do casal.
- **Casal**: um cria o casal e recebe um código; o outro entra com o código.
- **Quando investir**: Selic, IPCA 12m, juro real e Selic esperada (Focus) do Banco Central, mais Ibovespa e algumas ações (IFR, médias de 200 dias, distância da máxima). Gera sinais "Bom momento / Neutro / Cautela" para pós-fixados, prefixados, IPCA+ e ações. É conteúdo educativo, não recomendação de investimento.

## Rodando localmente

```bash
npm install
npm run dev
```

Sem variáveis de ambiente, o app abre em **modo demonstração**: dados fictícios em memória e dois usuários (Carlos e Parceira) para ver a tela de cada um.

## Usando de verdade (Supabase)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No SQL Editor, rode o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Ele cria as tabelas e as regras de segurança (RLS) que garantem que cada um só vê o que é seu e o que é do casal.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
4. `npm run dev`, crie as duas contas em **Criar conta** e conectem-se na página **Casal** com o código de convite.

Se a confirmação de e-mail estiver ligada no Supabase (Authentication → Providers → Email), cada um precisa confirmar o e-mail antes de entrar.

Para publicar, a Vercel funciona direto: importe o repositório e configure as mesmas variáveis.

### Dados de mercado

- Banco Central (SGS e Focus): sem chave.
- Cotações: Yahoo Finance (sem chave). Se falhar, usa a [brapi.dev](https://brapi.dev) quando `BRAPI_TOKEN` estiver configurado.
- Os dados ficam em cache por 1 hora. Se alguma fonte cair, a página mostra o que conseguiu e avisa o que faltou.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm test` | testes (cálculos e sinais de mercado) |
| `npm run lint` / `npm run typecheck` | checagens |

Stack: Next.js 15 (App Router), React 19, Tailwind CSS 4, Recharts, Supabase (Auth + Postgres).
