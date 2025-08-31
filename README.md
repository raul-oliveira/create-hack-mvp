# Church Leader Assistant - MVP

Um assistente inteligente para líderes de célula gerenciarem o cuidado pastoral de seus liderados.

## 🚀 Tecnologias

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Autenticação:** Supabase Auth (email/senha + Google OAuth)
- **Estado:** React Query + Zustand
- **Deploy:** Vercel

## 📋 Funcionalidades (MVP)

### Epic 1: Foundation & Authentication Infrastructure ✅
- [x] Projeto Next.js configurado com TypeScript
- [x] Integração com Supabase e Prisma
- [x] Sistema de autenticação completo
- [x] Dashboard básico funcional

### Epic 2-5: Em Desenvolvimento
- [ ] Integração InChurch API
- [ ] Engine de geração de iniciativas com IA
- [ ] Sistema de execução via WhatsApp
- [ ] Gestão de relacionamentos e analytics

## 🛠️ Configuração Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL (ou conta Supabase)
- Conta Google Cloud (para OAuth)

### Instalação

1. **Clone e instale dependências:**
```bash
git clone <repository>
cd church-leader-assistant
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

3. **Configure o banco de dados:**
```bash
# Se usar Supabase local
npx supabase start

# Ou configure PostgreSQL local e execute:
npx prisma migrate dev
```

4. **Gere o Prisma Client:**
```bash
npx prisma generate
```

5. **Inicie o servidor:**
```bash
npm run dev
```

Aplicação disponível em: http://localhost:3000

## 📊 Schema do Banco

O sistema usa uma arquitetura multi-tenant com as seguintes entidades principais:

- **organizations** - Igrejas/organizações
- **leaders** - Líderes de célula
- **people** - Liderados
- **initiatives** - Ações pastorais sugeridas
- **people_changes** - Mudanças detectadas nos dados
- **initiative_feedback** - Feedback das ações executadas

## 🔐 Autenticação

- Email/senha via Supabase Auth
- Google OAuth integrado
- Row Level Security (RLS) configurado
- Middleware automático para rotas protegidas

## 🚀 Deploy

O projeto está configurado para deploy no Vercel:

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente na dashboard
3. Deploy automático a cada push na main

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run type-check   # Verificação de tipos
npm run db:migrate   # Executar migrações
npm run db:generate  # Gerar Prisma Client
npm run db:studio    # Interface gráfica do banco
```

## 🗂️ Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── auth/callback/     # OAuth callback
│   └── api/               # API routes
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   └── prisma.ts         # Cliente Prisma
└── types/                 # Definições TypeScript
```

## 🔮 Próximos Passos

### Epic 2: InChurch Integration & Data Sync
- API client InChurch
- Sistema de webhooks
- Polling diário automatizado
- CRUD manual para igrejas sem InChurch

### Epic 3: Initiative Generation & AI Engine
- Detecção de mudanças
- Agente LLM para scoring
- Geração de mensagens contextuais
- Configuração de tom personalizado

### Epic 4: Initiative Execution & WhatsApp Integration
- Editor de mensagens
- Deep linking WhatsApp
- Sistema de status tracking
- Captura de feedback

### Epic 5: Leader-Member Relationship Management
- Prontuários completos
- Analytics e insights
- Gestão de relacionamentos
- Relatórios pastorais

## 🤝 Contribuição

Este é um projeto MVP focado em validação. Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está em desenvolvimento como MVP para validação de mercado.
