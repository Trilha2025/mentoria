# Consultoria & Comunidade - Trilha do Ecommerce 🚀

Plataforma completa de gestão de mentorias com sistema de módulos, aulas, submissões, suporte e acompanhamento de progresso.

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)

## 🛠 Tecnologias

- **Framework**: Next.js 16.1.6 (App Router + Turbopack)
- **Linguagem**: TypeScript 5
- **Banco de Dados**: PostgreSQL (via Supabase)
- **ORM**: Prisma 6.19.2
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS 4
- **Hospedagem**: Vercel

## ✨ Funcionalidades

### Para Mentorados
- 📚 Acesso a módulos e aulas estruturadas
- 📝 Sistema de anotações com auto-save
- 📤 Submissão de tarefas e documentos
- 📊 Acompanhamento de progresso
- 🎯 Plano de estudos personalizado
- 📅 Agenda de estudos (Planner)
- 💬 Sistema de suporte via tickets
- 🔔 Notificações em tempo real
- 👤 Perfil com avatar customizável

### Para Mentores
- 👥 Gestão de mentorados
- ✅ Avaliação de submissões
- 📈 Dashboard com métricas
- 🔓 Controle de acesso a módulos/aulas
- 💬 Atendimento via tickets
- 📊 Fila de revisão prioritária

### Para Administradores
- 👨‍💼 Gestão completa de usuários
- 📚 Criação e edição de módulos/aulas
- 🔐 Controle de permissões
- 📊 Visão geral da plataforma
- 👥 Gerenciamento de equipe

## 🏗 Arquitetura

### Modelos Principais

```
User (ADMIN | MENTOR | MENTEE)
├── Module
│   └── Lesson
│       ├── LessonProgress
│       ├── LessonNote
│       └── DocumentSubmission
├── SupportTicket
│   └── TicketMessage
├── Notification
├── StudyPlanItem
└── PlannerItem
```

### Fluxo de Autenticação

1. Login via Supabase Auth
2. Middleware valida sessão
3. UserProvider carrega dados do Prisma
4. Redirecionamento baseado em role:
   - `ADMIN` → `/admin`
   - `MENTOR` → `/mentoria`
   - `MENTEE` → `/dashboard`

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/Trilha2025/mentoria.git
cd mentoria

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute as migrations do Prisma
npx prisma migrate dev

# Gere o Prisma Client
npx prisma generate

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie as credenciais do projeto
3. Execute o script de setup do bucket de avatares:
   ```sql
   -- Ver arquivo: setup_avatars_bucket.sql
   ```

### Primeiro Usuário Admin

```bash
# Via API (após deploy)
curl -X POST https://seu-dominio.vercel.app/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senha-segura",
    "name": "Admin",
    "role": "ADMIN"
  }'
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório** ao Vercel
2. **Configure as variáveis de ambiente**:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy automático** via Git push

### Troubleshooting de Deploy

**Erro: "No Next.js version detected"**
- ✅ Resolvido: `vercel.json` configurado com framework explícito

**Erro: "Prisma Client not initialized"**
- ✅ Resolvido: Script `postinstall` adicionado ao `package.json`

**Erro: "Invalid supabaseUrl"**
- ✅ Verificar: Remover aspas das variáveis de ambiente no Vercel

**Erro: "401 Unauthorized" no login**
- ✅ Verificar: Variáveis `NEXT_PUBLIC_SUPABASE_*` corretas
- ✅ Verificar: Usuário existe no Supabase Auth

## 📁 Estrutura do Projeto

```
mentoria/
├── app/
│   ├── (student)/          # Rotas do mentorado
│   │   ├── dashboard/
│   │   ├── cadernos/
│   │   ├── materiais/
│   │   └── plano-estudo/
│   ├── admin/              # Painel administrativo
│   │   ├── lessons/
│   │   ├── mentoria/
│   │   ├── review-queue/
│   │   └── team/
│   ├── mentoria/           # Painel do mentor
│   ├── api/                # API Routes
│   │   ├── admin/
│   │   ├── lessons/
│   │   ├── notifications/
│   │   ├── planner/
│   │   ├── submissions/
│   │   └── tickets/
│   ├── login/
│   └── modulo/[id]/        # Visualização de aula
├── components/
│   ├── Dashboard/
│   ├── Providers/
│   └── ui/
├── lib/
│   ├── prisma.ts           # Cliente Prisma
│   └── supabase.ts         # Cliente Supabase
├── prisma/
│   └── schema.prisma       # Schema do banco
├── middleware.ts           # Proteção de rotas
└── package.json
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linter ESLint
npx prisma studio    # Interface visual do banco
npx prisma migrate   # Criar/aplicar migrations
```

## 📝 Próximas Funcionalidades

Ver [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) para roadmap completo.

## 📄 Licença

© 2024-2026 - Todos os direitos reservados.

---

**Desenvolvido com ❤️ para mentorias de alto valor**
