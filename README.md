# ⚙ Biblioteca de Jogos Steampunk

Sistema web para alunos enviarem jogos, a administração analisar e publicar, e todo mundo descobrir, favoritar, avaliar e jogar.

Baseado no fluxograma em `docs/fluxograma_biblioteca_jogos_steampunk.pdf`.

## Stack

- **React + Vite** (JavaScript)
- **Supabase** — Auth, Postgres, Storage e RLS
- **Render** — hospedagem do site

## Como rodar

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute.
   - Isso cria tabelas, regras de status, políticas de segurança e o bucket `capas`.
3. Em **Authentication → Providers → Email**, revise:
   - Para testar rápido, desative **Confirm email** (o cadastro entra direto).
   - Em produção, mantenha ativado.

### 2. Configurar as variáveis

Copie `.env.example` para `.env` e preencha com os dados de **Project Settings → API**:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

> A `anon key` é pública por natureza. **Nunca** use a `service_role` no front-end.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

### 4. Virar administrador

Crie sua conta pelo site, depois rode no SQL Editor (trocando o e-mail):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'seu@email.com');
```

Saia e entre de novo: o menu **Painel** aparece.

## Fluxo do sistema

```
login → perfil (aluno | admin)

ALUNO
  biblioteca → detalhes → favoritar / avaliar / jogar
  enviar jogo → pendente → (recusado → corrigir → pendente)
                        → aprovado (aguardando capa) → envia capa → capa recebida

ADMIN
  painel → analisar → aprovar / recusar com motivo
        → publicar (depois da capa)
```

## Estrutura

```
src/
├── components/   Header, GameCard, Stars, StatusBadge, Notice, GearLoader...
├── context/      AuthContext (sessão + perfil + role)
├── lib/          supabase.js, constants.js
├── pages/        Login, Biblioteca, GameDetails, SubmitGame,
│                 MySubmissions, Admin, AdminGame
└── styles/       theme.css (tema steampunk)
supabase/
└── schema.sql    banco, políticas, triggers e bucket
docs/             fluxograma original
```

## Deploy no Render

1. Suba o projeto para um repositório no GitHub.
2. No Render: **New → Static Site** e conecte o repositório.
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
4. Em **Redirects/Rewrites**, adicione:
   - Source: `/*` · Destination: `/index.html` · Action: `Rewrite`
   (necessário para as rotas do React Router funcionarem ao recarregar a página).

## Segurança (resumo)

- Aluno só vê jogos publicados + os próprios envios.
- Aluno só edita os próprios envios e apenas nas transições permitidas por trigger.
- Ninguém consegue se promover a admin.
- Avaliações e favoritos são por usuário.
- Capas ficam num bucket público de leitura; upload só na pasta do próprio usuário.
