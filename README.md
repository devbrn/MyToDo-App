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
- PostgreSQL 14+ (ou SQLite para desenvolvimento)
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

3. **Configure o ambiente:**
```bash
# Backend - Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Frontend - Copie o arquivo de exemplo  
cp frontend/.env.example frontend/.env

# Edite os arquivos .env conforme necessário
# O sistema detecta automaticamente portas disponíveis
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

### Desenvolvimento (Recomendado)
```bash
# Inicia backend e frontend de forma coordenada
# O sistema detecta automaticamente portas disponíveis
npm run dev
```

**Funcionalidades do novo sistema:**
- ✅ **Detecção automática de portas:** Evita conflitos de porta
- ✅ **Inicialização coordenada:** Backend inicia primeiro, depois frontend
- ✅ **Configuração dinâmica:** Frontend se conecta automaticamente ao backend
- ✅ **Logs organizados:** Saída clara de ambos os serviços
- ✅ **Shutdown graceful:** Ctrl+C encerra ambos os serviços

### Executar separadamente (Modo Legado)
```bash
# Backend (porta padrão: 3001, detecta automaticamente se ocupada)
npm run dev:backend

# Frontend (porta padrão: 3004, detecta automaticamente se ocupada)  
npm run dev:frontend

# Modo antigo (sem detecção de porta)
npm run dev:old
```

### Build para Produção
```bash
npm run build
npm start
```

## 🔧 Configuração de Portas

O sistema implementa **detecção automática de portas** para evitar conflitos:

### Backend
- **Porta padrão:** 3001
- **Detecção:** Se a porta estiver ocupada, tenta 3002, 3003, etc.
- **Configuração:** Salva automaticamente em `port-config.json`

### Frontend  
- **Porta padrão:** 3004 (Vite)
- **Detecção:** Vite detecta automaticamente portas ocupadas
- **API:** Lê configuração do backend automaticamente

### Arquivos de Configuração
```
port-config.json          # Gerado automaticamente pelo backend
frontend/public/port-config.json  # Copiado pelo script de inicialização
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