# CLAUDE.md — Domesticando App

Guia de contexto para o Claude Code. Leia antes de qualquer tarefa de desenvolvimento.

---

## VISÃO GERAL DO PROJETO

**Domesticando** é um app de gestão financeira pessoal. Pessoas físicas cadastram transações, acompanham um dashboard com gráficos e exportam relatórios.

**Estado atual do código:** a base existente foi construída com **Vite + React + TypeScript** como um tracker de sintomas/tratamento. O objetivo é evoluir (ou migrar) para a stack definitiva descrita abaixo, mantendo a autenticação Supabase já implementada.

---

## 1. USER PERSONAS

**Pessoa física — usuário único autenticado**
- Deseja organizar suas finanças pessoais
- Cadastra transações (receitas e despesas)
- Acompanha o dashboard com saldo e gráficos
- Exporta relatórios

> Escopo de aula: apenas um tipo de usuário autenticado. Cada usuário vê e gerencia somente seus próprios dados (Row Level Security no Supabase).

---

## 2. TECHNICAL STACK

### Tecnologias selecionadas

| Camada | Tecnologia |
|---|---|
| Frontend framework | Next.js 14+ (App Router) |
| UI library | React + TypeScript |
| Estilo | Tailwind CSS |
| Componentes | shadcn/ui |
| Gráficos | Recharts |
| Backend / BaaS | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel |
| Dev tooling | Claude Code + Git / GitHub |

### Detalhes

- **Frontend:** Next.js 14+ com App Router, TypeScript estrito, Tailwind CSS e shadcn/ui. Gráficos com Recharts.
- **Backend:** Supabase — sem backend separado. Toda lógica de dados via Supabase client + RLS.
- **Auth:** Supabase Auth (já parcialmente implementada em `src/contexts/AuthContext.tsx`).
- **Deploy:** Vercel com integração contínua via GitHub.
- **Responsivo:** layout adaptável para desktop e mobile com Tailwind CSS.

### Estado atual da stack (base de código existente)

```
Vite 6 + React 19 + TypeScript 5
React Router DOM 7
@supabase/supabase-js 2
@tanstack/react-query 5
js-cookie
```

> ⚠️ Para alinhar com a stack target, será necessário migrar de Vite para Next.js 14+ (App Router) e instalar Tailwind CSS, shadcn/ui e Recharts.

---

## 3. DESIGN LANGUAGE

### Inspirações visuais
- **shadcn/ui Dashboard Template** — referência principal para layout de dashboard moderno, minimalista e responsivo.
- Estilo geral: interface clara, fontes sem serifa, cards com bordas suaves, paleta neutra com acentos em azul/verde.

### Padrões já presentes no código
- Dark theme: fundo `#0a0a0c` → `#111115`, superfícies `#161618`
- Accent color: `primary` (azul)
- Cards com `border border-white/[0.06]` e `backdrop-blur`
- Animações de entrada via `animate-enter`
- Gradientes decorativos de fundo (blobs com blur)

### Diretrizes
- Layout responsivo mobile-first com Tailwind CSS
- Componentes de UI via shadcn/ui (Button, Card, Input, Select, Dialog, Table, etc.)
- Gráficos de linha/barra/pizza com Recharts para o dashboard financeiro

---

## 4. ARQUITETURA DE DADOS (Supabase / PostgreSQL)

### Tabelas principais (a criar)

```sql
-- Perfil do usuário (sincronizado com auth.users via trigger)
profiles (id uuid PK, name text, email text, created_at timestamptz)

-- Categorias de transação
categories (id uuid PK, user_id uuid FK, name text, type text, color text, created_at timestamptz)

-- Transações financeiras
transactions (
  id uuid PK,
  user_id uuid FK,
  category_id uuid FK,
  description text,
  amount numeric(12,2),
  type text CHECK (type IN ('income','expense')),
  date date,
  created_at timestamptz
)
```

### Row Level Security
Todas as tabelas devem ter RLS habilitado com policy `user_id = auth.uid()`.

---

## 5. ESTRUTURA DE ROTAS (Next.js App Router)

```
app/
  layout.tsx              # RootLayout com providers
  page.tsx                # Redirect para /dashboard
  (auth)/
    login/page.tsx        # Login / Cadastro / Esqueci senha
  (app)/
    layout.tsx            # Layout com sidebar + header
    dashboard/page.tsx    # Visão geral: saldo, gráficos, resumo
    transactions/page.tsx # Lista e cadastro de transações
    categories/page.tsx   # Gerenciar categorias
    reports/page.tsx      # Exportar relatórios
```

---

## 6. FUNCIONALIDADES CORE (Milestones)

### Milestone 1 — Fundação
- [ ] Migrar para Next.js 14 + Tailwind CSS + shadcn/ui
- [ ] Configurar Supabase (URL + anon key em `.env.local`)
- [ ] Auth funcional: login, cadastro, logout, recuperação de senha
- [ ] Layout base com sidebar responsiva (desktop = sidebar, mobile = bottom nav ou drawer)

### Milestone 2 — Transações
- [ ] Criar tabela `transactions` com RLS no Supabase
- [ ] CRUD de transações (receita / despesa)
- [ ] Formulário com validação (data, valor, descrição, categoria, tipo)
- [ ] Listagem com filtros por período e tipo

### Milestone 3 — Dashboard
- [ ] Cards de resumo: saldo total, total receitas, total despesas
- [ ] Gráfico de linha — evolução mensal (Recharts)
- [ ] Gráfico de pizza — despesas por categoria (Recharts)

### Milestone 4 — Categorias e Relatórios
- [ ] CRUD de categorias com cor personalizada
- [ ] Exportar relatório em CSV
- [ ] Filtros avançados por data e categoria

---

## 7. PROCESS

- Quebrar a construção do app em milestones lógicos (ver seção 6)
- Cada milestone é um incremento entregável e testável
- Priorizar funcionalidade core antes de polish
- Testar cada milestone antes de avançar
- Commit frequente via Git; deploy automático na Vercel via push para `main`

---

## 8. CONVENÇÕES DE CÓDIGO

- TypeScript estrito (`strict: true`)
- Componentes em `components/`, páginas em `app/`
- Funções utilitárias em `lib/`
- Tipos compartilhados em `types/`
- Sem comentários óbvios; apenas comentários para invariantes não óbvias
- Sem `any` — tipar tudo explicitamente
- Queries Supabase via React Query (`@tanstack/react-query`)

---

## 9. VARIÁVEIS DE AMBIENTE

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> Arquivo `.env.local` (nunca commitar). Para Vite legacy: prefixo `VITE_`.
