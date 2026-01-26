# 🗄️ Configuração de Banco de Dados - Salva Plantão

Este documento fornece o guia completo para configurar, migrar e testar o banco de dados do Salva Plantão.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Configuração Rápida](#configuração-rápida)
4. [Setup Local](#setup-local)
5. [Setup no Replit](#setup-no-replit)
6. [Comandos Disponíveis](#comandos-disponíveis)
7. [Provedores Suportados](#provedores-suportados)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Visão Geral

### Stack Técnica

- **ORM**: Drizzle ORM v0.39.3
- **Database**: PostgreSQL 15+
- **Driver**: node-postgres (pg)
- **Migrations**: Drizzle Kit

### Arquitetura

```
/shared/schema.ts          → Schema definitions (15+ tables)
/server/db.ts              → Database connection & pooling
/drizzle.config.ts         → Drizzle configuration
/scripts/db-seed.ts        → Seed data script
/scripts/db-check.ts       → Connection verification
/migrations/               → SQL migrations (generated)
```

### Variável de Ambiente Principal

**DATABASE_URL** é a ÚNICA variável necessária:

```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

---

## ✅ Requisitos

### Software Necessário

- **Node.js** 20.x ou superior
- **PostgreSQL** 15+ (local ou remoto)
- **npm** ou **yarn**

### Provedores Compatíveis

✅ Supabase (pooler port 6543)  
✅ Neon (serverless PostgreSQL)  
✅ Render PostgreSQL  
✅ Replit Database  
✅ PostgreSQL local  
✅ Qualquer PostgreSQL padrão com SSL

---

## 🚀 Configuração Rápida

### 1. Clone e Instale

```bash
git clone <repository>
cd salva-plantao-app
npm install
```

### 2. Configure DATABASE_URL

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite `.env` e adicione sua DATABASE_URL:

```env
# Exemplo Supabase
DATABASE_URL=postgresql://postgres.xyz:senha@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Exemplo Neon
DATABASE_URL=postgresql://user:senha@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Exemplo Local
DATABASE_URL=postgresql://postgres:senha@localhost:5432/salva_plantao?sslmode=require
```

### 3. Verifique a Conexão

```bash
npm run db:check
```

✅ Este comando irá:
- Validar DATABASE_URL
- Testar conexão
- Verificar tabelas existentes
- Confirmar permissões

### 4. Inicialize o Banco

```bash
# Cria/atualiza as tabelas
npm run db:push

# Insere dados iniciais (planos, configurações)
npm run db:seed
```

### 5. Inicie o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

---

## 💻 Setup Local

### Opção A: PostgreSQL Nativo

#### 1. Instalar PostgreSQL

**Windows:**
```bash
# Baixe e instale de: https://www.postgresql.org/download/windows/
# Ou use chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Criar Database

```bash
# Conectar como usuário postgres
sudo -u postgres psql

# Criar database e usuário
CREATE DATABASE salva_plantao;
CREATE USER salva_user WITH PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE salva_plantao TO salva_user;
\q
```

#### 3. Configurar .env

```env
DATABASE_URL=postgresql://salva_user:sua_senha_forte@localhost:5432/salva_plantao?sslmode=require
```

#### 4. Aplicar Schema

```bash
npm run db:check    # Verificar conexão
npm run db:push     # Criar tabelas
npm run db:seed     # Inserir dados iniciais
```

### Opção B: Docker

#### 1. Criar docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: salva-plantao-db
    environment:
      POSTGRES_DB: salva_plantao
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### 2. Iniciar Container

```bash
docker-compose up -d
```

#### 3. Configurar .env

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/salva_plantao?sslmode=require
```

#### 4. Aplicar Schema

```bash
npm run db:check
npm run db:push
npm run db:seed
```

---

## ☁️ Setup no Replit

### Opção 1: Supabase (Recomendado)

#### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Aguarde o database ser provisionado

#### 2. Obter Connection String

No painel Supabase:
- Settings → Database → Connection string
- Selecione **Connection Pooling** (porta 6543)
- Modo: **Transaction**
- Copie a string (formato: `postgresql://postgres.xyz:...@...pooler.supabase.com:6543/postgres`)

#### 3. Configurar no Replit

No Replit:
1. Clique no ícone 🔒 **Secrets** (cadeado na barra lateral)
2. Adicione nova secret:
   - Key: `DATABASE_URL`
   - Value: Cole a connection string do Supabase
3. Certifique-se que termina com `?sslmode=require`

#### 4. Inicializar Database

No Shell do Replit:

```bash
npm run db:check    # Verifica conexão
npm run db:push     # Cria tabelas
npm run db:seed     # Insere dados
```

#### 5. Deploy

1. Clique em **Deploy**
2. O Replit usará automaticamente a secret DATABASE_URL

### Opção 2: Neon

#### 1. Criar Projeto no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Crie novo projeto
3. Escolha região próxima

#### 2. Obter Connection String

No dashboard Neon:
- Connection Details → Connection string
- Copie a string completa

#### 3. Configurar no Replit

Mesmo processo que Supabase (usando Secrets).

---

## 📝 Comandos Disponíveis

### Verificação e Diagnóstico

```bash
# Verifica conexão e estado do banco
npm run db:check
```

**Output esperado:**
```
✅ DATABASE_URL is set
✅ Successfully connected to database
✅ Found 15 tables
✅ Write permissions confirmed
✅ Database Check PASSED
```

### Migrations

```bash
# Gera arquivos de migration SQL (cria /migrations/)
npm run db:generate

# Aplica migrations pendentes (usa /migrations/)
npm run db:migrate

# Push schema direto (sem gerar migration files)
npm run db:push
```

**Quando usar cada um:**

- **db:generate + db:migrate**: Produção (rastreável, versionado)
- **db:push**: Desenvolvimento rápido (não gera histórico)

### Seeds

```bash
# Insere dados iniciais (planos, configurações)
npm run db:seed
```

**O que é inserido:**
- ✅ Planos padrão (Básico, Profissional, Premium)
- ✅ Billing plans
- ✅ Configurações iniciais

### Workflow Completo

```bash
# Setup inicial completo
npm run db:push && npm run db:seed

# Ou use o atalho:
npm run db:setup
```

---

## 🌐 Provedores Suportados

### Supabase

**Vantagens:**
- ✅ Free tier generoso
- ✅ Connection pooler otimizado
- ✅ Backups automáticos
- ✅ Interface visual

**Connection String:**
```
postgresql://postgres.xyz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Configuração SSL:** Automática (pooler)

---

### Neon

**Vantagens:**
- ✅ Serverless (escala a zero)
- ✅ Branches de database
- ✅ Muito rápido

**Connection String:**
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Configuração SSL:** Automática

---

### Render PostgreSQL

**Vantagens:**
- ✅ Integrado com deploys
- ✅ Backups diários
- ✅ 90 dias free trial

**Connection String:**
```
postgresql://user:pass@dpg-xxx-a.oregon-postgres.render.com/dbname?sslmode=require
```

**Configuração SSL:** 
- O código já está configurado com `rejectUnauthorized: false`
- Funciona out-of-the-box

---

### PostgreSQL Local

**Vantagens:**
- ✅ Desenvolvimento offline
- ✅ Controle total

**Connection String:**
```
postgresql://postgres:password@localhost:5432/salva_plantao?sslmode=require
```

**Nota:** SSL local pode ser `?sslmode=prefer` se não configurado.

---

## 🔧 Troubleshooting

### Erro: "DATABASE_URL must be set"

**Causa:** Variável de ambiente não configurada.

**Solução:**
```bash
# Local: crie/edite .env
cp .env.example .env
# Adicione: DATABASE_URL=...

# Replit: adicione em Secrets
```

---

### Erro: "ENOTFOUND" ou "getaddrinfo"

**Causa:** Host do database não encontrado.

**Soluções:**
1. Verifique se o hostname está correto
2. Teste conectividade: `ping seu-host.supabase.com`
3. Confirme que não está em rede bloqueada

---

### Erro: "Connection refused"

**Causa:** Database não está rodando ou porta incorreta.

**Soluções:**

**Local:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Iniciar se necessário
sudo systemctl start postgresql
```

**Cloud:** Verifique se o database está pausado no painel do provedor.

---

### Erro: "SSL SYSCALL error"

**Causa:** Problemas com certificado SSL.

**Solução:**
1. Certifique-se que `?sslmode=require` está na URL
2. O código já tem `rejectUnauthorized: false` configurado
3. Se persistir, tente `?sslmode=prefer`

---

### Erro: "password authentication failed"

**Causa:** Credenciais incorretas.

**Soluções:**
1. Verifique username/password na DATABASE_URL
2. Redefina senha no painel do provedor
3. Certifique-se que não há caracteres especiais sem encoding (use `%40` para `@`)

---

### Erro: "No tables found"

**Causa:** Schema não foi aplicado.

**Solução:**
```bash
npm run db:push
npm run db:seed
```

---

### Erro: "drizzle-kit: command not found"

**Causa:** Dependências não instaladas.

**Solução:**
```bash
npm install
# Ou force reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Conexão lenta ou timeout

**Causas possíveis:**
- Cold start do database
- Região geográfica distante
- Conexões no pool esgotadas

**Soluções:**

**Aumentar timeouts** (em `server/db.ts`):
```typescript
connectionTimeoutMillis: 60000,  // 60s
```

**Escolher região próxima:**
- Supabase: `aws-0-us-east-1` (EUA)
- Neon: escolha região no setup

**Verificar pool:**
```bash
npm run db:check
```

---

## 🧪 Testes

### Verificar Endpoints

#### Health Check

```bash
curl http://localhost:5000/health
```

**Esperado:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-26T10:30:00.000Z"
}
```

#### Criar Usuário (POST /api/register)

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "SenhaForte123!",
    "name": "Teste"
  }'
```

#### Login (POST /api/login)

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "SenhaForte123!"
  }'
```

---

## 📚 Recursos Adicionais

### Estrutura do Schema

**Principais tabelas:**

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários e autenticação |
| `sessions` | Sessões de login |
| `medications` | Biblioteca de medicamentos |
| `pathologies` | Biblioteca de patologias |
| `prescriptionModels` | Templates de prescrições |
| `checklists` | Checklists médicos |
| `protocols` | Protocolos clínicos |
| `flashcards` | Cards de estudo |
| `conversations` | Conversas com IA |
| `billingPlans` | Planos de assinatura |

### Links Úteis

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Supabase Docs](https://supabase.com/docs)
- [Neon Docs](https://neon.tech/docs/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 📞 Suporte

**Problemas com este guia?**
- Abra uma issue no repositório
- Contato: suporte@appsalvaplantao.com

---

## 🔄 Changelog

### v1.0.0 (2024-01-26)
- ✅ Documentação inicial completa
- ✅ Scripts de verificação e diagnóstico
- ✅ Suporte a múltiplos provedores
- ✅ Guias de troubleshooting
