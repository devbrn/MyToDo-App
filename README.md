# MyToDo App

Uma aplicação web de tarefas pessoais com foco em velocidade, interface minimalista e processamento de linguagem natural (NLP).

## 🚀 Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + TypeScript + Express
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Funcionalidades:** NLP para datas e tags, navegação por teclado

## 📋 Funcionalidades do MVP

1. **Criação Rápida de Tarefas:** Adicionar tarefas em sequência com ENTER
2. **Edição de Tarefas:** Editar texto de tarefas existentes
3. **Conclusão de Tarefas:** Marcar/desmarcar como concluídas
4. **NLP para Datas:** Interpretar "hoje", "amanhã" automaticamente
5. **NLP para Tags:** Interpretar `#palavra` para categorização
6. **Visualização Única:** Lista simples e eficiente

## 🛠️ Setup do Projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd MyToDo
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados:**
```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Edite o arquivo .env com suas configurações de banco
# DATABASE_URL="postgresql://username:password@localhost:5432/mytodo_db?schema=public"
```

4. **Execute as migrations:**
```bash
npm run db:migrate
```

5. **Gere o Prisma Client:**
```bash
npm run db:generate
```

## 🚀 Executando o Projeto

### Desenvolvimento (Frontend + Backend)
```bash
npm run dev
```

### Executar separadamente
```bash
# Backend (porta 3001)
npm run dev:backend

# Frontend (porta 3000)
npm run dev:frontend
```

### Build para Produção
```bash
npm run build
npm start
```

## 🗄️ Banco de Dados

### Prisma Studio (Interface Visual)
```bash
npm run db:studio
```

### Comandos Úteis
```bash
# Nova migration
npm run db:migrate

# Reset do banco
cd backend && npx prisma migrate reset

# Seed do banco
npm run db:seed
```

## 🧪 Testes

```bash
# Todos os testes
npm test

# Testes do backend
npm run test:backend

# Testes do frontend
npm run test:frontend
```

## 📁 Estrutura do Projeto

```
MyToDo/
├── backend/           # API Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── types/
│   └── prisma/
├── frontend/          # React + TypeScript
│   └── src/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       └── services/
└── docs/             # Documentação (ignorada no Git)
```

## 🎯 API Endpoints

- `GET /api/tasks` - Lista todas as tarefas
- `POST /api/tasks` - Cria nova tarefa (com NLP)
- `PUT /api/tasks/:id` - Atualiza tarefa
- `DELETE /api/tasks/:id` - Remove tarefa

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executa frontend + backend |
| `npm run build` | Build de produção |
| `npm test` | Executa todos os testes |
| `npm run db:migrate` | Executa migrations |
| `npm run db:studio` | Abre Prisma Studio |

## 📝 Licença

MIT License