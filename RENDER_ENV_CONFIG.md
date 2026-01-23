# 🚀 Configuração de Variáveis de Ambiente para Render

## Variáveis Obrigatórias

### 1. **DATABASE_URL** (PostgreSQL Connection)
```
postgresql://user:password@db.supabase.co:5432/postgres?sslmode=require
```

**Componentes:**
- **Host:** `db.supabase.co` ou seu IP de banco de dados
- **Porta:** `5432` (padrão PostgreSQL)
- **Database:** `postgres` (ou seu nome de banco)
- **User:** seu usuário PostgreSQL
- **Password:** sua senha PostgreSQL
- **Query Param:** `?sslmode=require` (obrigatório para Supabase/Render)

**Exemplo completo Supabase:**
```
postgresql://postgres:sua_senha_aqui@db.supabase.co:5432/postgres?sslmode=require
```

> **⚠️ IMPORTANTE:** A porta **DEVE ser 5432** (porta padrão). Se estiver usando Supabase, você pode encontrar a conexão em Project Settings → Database → Connection Info.

### 2. **JWT_SECRET** (Autenticação JWT)
```
uma-chave-super-secreta-com-pelo-menos-32-caracteres-aleatorios
```

**Como gerar:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[Convert]::ToBase64String([byte[]]::ReadNew(32))
```

**Requisitos:**
- Mínimo 32 caracteres
- Altamente aleatória
- Nunca commit no git

### 3. **JWT_REFRESH_SECRET** (Refresh Token)
```
outra-chave-super-secreta-com-pelo-menos-32-caracteres-aleatorios
```

**Como gerar:** (mesmo processo que JWT_SECRET)

**Requisitos:**
- Diferente de JWT_SECRET
- Mínimo 32 caracteres

---

## Variáveis Opcionais

### 4. **AI_INTEGRATIONS_OPENAI_API_KEY** (Chat & Imagem)
```
sk-proj-seu-openai-api-key-aqui
```

**Notas:**
- Se não fornecido, a funcionalidade de chat retorna 503 "indisponível"
- A app continua funcionando normalmente
- Obtenha em: https://platform.openai.com/api-keys

### 5. **ASAAS_API_KEY** (Pagamentos)
```
sua-chave-asaas-api-aqui
```

**Notas:**
- Necessário para funcionalidade de cobrança
- Obtenha em: https://asaas.com/api

### 6. **NODE_ENV**
```
production
```

**Valores:**
- `production` - Modo produção (0.0.0.0, sem Vite dev server)
- `development` - Modo desenvolvimento (localhost)

**Padrão:** `production` no Render

### 7. **PORT**
```
5000
```

**Notas:**
- Render fornece automaticamente via `process.env.PORT`
- Fallback: 5000
- Você geralmente **NÃO precisa configurar** no Render

---

## 📋 Configuração Completa no Render

### Passo 1: Criar Web Service
1. Clique em **"New" → "Web Service"**
2. Conecte seu repositório GitHub
3. Preencha os detalhes básicos

### Passo 2: Adicionar Environment Variables
No painel do Render, vá para **"Environment"** e adicione:

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | ✅ |
| `JWT_SECRET` | `seu-valor-secreto-aqui` | ✅ |
| `JWT_REFRESH_SECRET` | `seu-outro-valor-secreto-aqui` | ✅ |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | `sk-proj-...` | ❌ (opcional) |
| `ASAAS_API_KEY` | `sua-chave-asaas` | ❌ (opcional) |

### Passo 3: Build & Start Commands
**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm run start
```

---

## 🔍 Verificação da Conexão

### Health Check
```bash
curl https://seu-app.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "auth": "independent",
  "node": "v22.0.0"
}
```

### Database Health Check
```bash
curl https://seu-app.onrender.com/api/health/db
```

**Resposta esperada (com DB):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "database": "postgresql"
}
```

**Resposta se DB indisponível (esperado no startup):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "error": "Database connection failed",
  "details": "..."
}
```

---

## ⚙️ Melhorias de Conexão Implementadas

1. **Connection Timeout**: `connectionTimeoutMillis: 10000`
   - Detecta falhas de conexão em até 10 segundos
   
2. **Idle Timeout**: `idleTimeoutMillis: 30000`
   - Fecha conexões ociosas após 30 segundos
   
3. **Pool Size**: `max: 20`
   - Máximo de 20 conexões simultâneas
   
4. **SSL Config**: `ssl: { rejectUnauthorized: false }`
   - Suporta certificados self-signed (Supabase/Render)
   
5. **Auto SSL Mode**: `?sslmode=require`
   - Injetado automaticamente na DATABASE_URL

6. **Non-blocking Seeding**
   - Seeding ocorre APÓS servidor estar listening
   - Falhas de seeding não derrubam o servidor
   - Logs disponíveis mas não críticos

---

## 🆘 Troubleshooting

### Erro: "DATABASE_URL must be set"
- [ ] Verifique se DATABASE_URL foi adicionado ao Environment
- [ ] Verifique se o valor não está vazio
- [ ] Redeploy após adicionar a variável

### Erro: "Circuit breaker open"
- [ ] Verifique se `?sslmode=require` está na DATABASE_URL
- [ ] Verifique credenciais (user/password)
- [ ] Verifique porta (deve ser 5432)
- [ ] Aguarde 10 segundos (connectionTimeoutMillis)
- [ ] Verifique logs do Render

### Chat/Imagem retorna 503
- [ ] Isso é ESPERADO se AI_INTEGRATIONS_OPENAI_API_KEY não está configurado
- [ ] Resto da app continua funcionando normalmente
- [ ] Adicione a chave OpenAI se deseja ativar

### App não responde após deploy
- [ ] Acesse `/health` para verificar se servidor está up
- [ ] Acesse `/api/health/db` para verificar DB
- [ ] Verifique logs do Render por erros de conexão

---

## 📝 Exemplo `.env` para Teste Local

```bash
# Autenticação
NODE_ENV=development
JWT_SECRET=seu-secret-super-secreto-com-32-caracteres-aleatorios-aqui
JWT_REFRESH_SECRET=seu-refresh-super-secreto-com-32-caracteres-aleatorios-aqui

# Banco de dados (ajuste com seus dados Supabase)
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/salva_plantao?sslmode=require

# IA (opcional)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-proj-seu-chave-aqui

# Pagamentos (opcional)
ASAAS_API_KEY=sua-chave-asaas-aqui
```

---

**Última atualização:** Janeiro 2026  
**Commit:** 0a39b4d
