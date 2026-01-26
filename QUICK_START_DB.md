# 🚀 Quick Start - Configuração de Banco de Dados

Guia rápido para colocar o Salva Plantão rodando em 5 minutos.

## ⚡ Setup em 3 Passos

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar DATABASE_URL

Escolha uma opção:

#### Opção A: Supabase (Recomendado para Replit)

1. Acesse [supabase.com](https://supabase.com) → Create Project
2. Aguarde provisioning (2-3 min)
3. Settings → Database → **Connection Pooling** (porta 6543)
4. Copie a connection string

#### Opção B: Neon (Alternativa rápida)

1. Acesse [neon.tech](https://neon.tech) → Create Project
2. Copie a connection string

#### Opção C: Local (Docker)

```bash
# docker-compose.yml
docker-compose up -d
```

### Adicionar ao .env (Local) ou Secrets (Replit)

**Local:**
```bash
cp .env.example .env
# Edite .env e cole sua DATABASE_URL
```

**Replit:**
1. Clique no ícone 🔒 Secrets
2. Add Secret: `DATABASE_URL` = `postgresql://...`

### 3️⃣ Inicializar Database

```bash
# Verifica conexão
npm run db:check

# Cria tabelas + insere dados
npm run db:setup
```

✅ **Pronto!** Agora rode:

```bash
npm run dev
```

---

## 🎯 Comandos Essenciais

| Comando | O que faz |
|---------|-----------|
| `npm run db:check` | Verifica conexão e estado |
| `npm run db:push` | Cria/atualiza tabelas |
| `npm run db:seed` | Insere dados iniciais |
| `npm run db:setup` | Push + Seed (tudo de uma vez) |
| `npm run dev` | Inicia servidor |

---

## 🔍 Verificar se Funcionou

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Esperado: `{"status":"ok", "database":"connected"}`

### 2. Criar Usuário Teste

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test"}'
```

Esperado: `201 Created` com dados do usuário

---

## ❌ Problemas Comuns

### "DATABASE_URL must be set"
→ Adicione no `.env` (local) ou Secrets (Replit)

### "Connection refused"
→ Database não está rodando ou URL incorreta

### "No tables found"
→ Execute: `npm run db:push`

### Mais ajuda?
→ Veja [DATABASE_SETUP.md](./DATABASE_SETUP.md) (guia completo)

---

## 📚 Próximos Passos

1. ✅ Database configurado → Pronto!
2. Configure JWT secrets (veja `.env.example`)
3. Opcional: Configure ASAAS (pagamentos)
4. Opcional: Configure OpenAI (IA)

---

## 🌐 DATABASE_URL Exemplos

```bash
# Supabase (pooler - porta 6543)
DATABASE_URL=postgresql://postgres.xyz:SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Neon (serverless)
DATABASE_URL=postgresql://user:SENHA@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Render
DATABASE_URL=postgresql://user:SENHA@dpg-xxx.oregon-postgres.render.com/dbname?sslmode=require

# Local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/salva_plantao?sslmode=require
```

**⚠️ IMPORTANTE:** 
- Sempre termine com `?sslmode=require` (exceto local)
- Supabase: use **pooler** (porta 6543), não direto (5432)
- Troque `SENHA` pela sua senha real

---

**Dúvidas?** Veja o guia completo em [DATABASE_SETUP.md](./DATABASE_SETUP.md)
