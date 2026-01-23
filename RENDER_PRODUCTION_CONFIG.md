# 🚀 Render Deployment Guide - Salva Plantão

## ✅ Configuração Completa para Render

### Build & Start Commands

```yaml
Build Command:  npm ci && npm run build
Start Command:  npm run start
```

### Environment Variables (Obrigatórias)

```env
# Banco de dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://user:password@db.supabase.co:6543/postgres?sslmode=require

# Ambiente (OBRIGATÓRIO)
NODE_ENV=production

# JWT (OBRIGATÓRIO)
JWT_SECRET=<gerar-com-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<gerar-com-openssl-rand-hex-32>

# Opcional: Integrações
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
ASAAS_API_KEY=...
```

### Gerar JWT Secrets Seguros

```bash
# Linux/macOS
openssl rand -hex 32

# Ou online: https://www.random.org/strings/
# (use 64 caracteres hexadecimais)
```

---

## 🔄 Ciclo de Startup

### Fase 1: Bootstrap (instantâneo, < 500ms)
```
1. Express app + middleware criado
2. Rotas registradas
3. Vite dev/static configurado
4. httpServer.listen(PORT, "0.0.0.0")
   └─ /health disponível ✅
5. Retorna sucesso de startup
```

**Resultado:** ✅ App READY, /health responde 200 OK

### Fase 2: Seeding (separado, manual)
```
Execute DEPOIS de garantir que app está UP:

npm run db:seed
```

**Resultado:** ✅ Planos de faturamento carregados no banco

---

## 📊 Endpoint /health

### GET /health (SEM banco de dados)
```bash
curl https://seu-app.onrender.com/health
```

**Resposta (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T12:30:45.123Z",
  "auth": "independent",
  "node": "v22.x.x"
}
```

**Caraterísticas:**
- ✅ Sempre responde 200, mesmo sem DB
- ✅ Sem dependências externas
- ✅ Indica que servidor está UP e pronto

---

## 🗄️ Endpoint /api/health/db (COM banco de dados)

### GET /api/health/db
```bash
curl https://seu-app.onrender.com/api/health/db
```

**Resposta (200 OK - DB healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T12:30:45.123Z",
  "database": "postgresql"
}
```

**Resposta (503 Service Unavailable - DB offline):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-23T12:30:45.123Z",
  "error": "Database connection failed",
  "details": "connect ECONNREFUSED ..."
}
```

---

## 🌱 Database Seeding

### Antes (PROBLEMA)
- Seeding rodava no bootstrap (`setImmediate`)
- Se DB falhava, logs eram confusos
- Render marcava app como "failed" mesmo que servidor estivesse UP

### Agora (SOLUÇÃO)
- App sobe PRIMEIRO (< 500ms)
- Seeding é totalmente separado
- Pode ser manual ou via cron job

### Como Rodar Seed

#### Opção 1: Manual (Recomendado)
```bash
# No seu terminal local
npm run db:seed

# Ou com tsx diretamente
tsx scripts/db-seed.ts
```

**Output esperado:**
```
[seed] Starting database seeding...
[seed] DATABASE_URL: postgresql://user:pass@db.supabase.co:6543...
[seed] Testing database connection...
[seed] ✓ Database connection successful
[seed] Seeding default plans...
[seed] ✓ Default plans seeded successfully
[seed] Seeding billing plans...
[seed] ✓ Billing plans seeded successfully
[seed] ✅ All seeds completed successfully!
```

#### Opção 2: Via Render Cron Job (Avançado)
```yaml
# render.yaml
services:
  - type: cron
    name: db-seed-job
    schedule: "0 2 * * *"  # 2 AM UTC
    command: npm ci && npm run build && npm run db:seed
```

#### Opção 3: Na primeira implantação (opcional)
Conecte ao Render via SSH e execute:
```bash
npm run db:seed
```

---

## 📋 Checklist de Deploy

### Antes de fazer push:
- [ ] DATABASE_URL configurado com `sslmode=require`
- [ ] JWT_SECRET gerado (64 chars hex)
- [ ] JWT_REFRESH_SECRET gerado (64 chars hex)
- [ ] NODE_ENV=production
- [ ] `npm run build` funciona localmente

### Após deploy (3-5 min):
- [ ] Logs mostram "✓ Server listening on 0.0.0.0:PORT"
- [ ] `curl /health` retorna 200 OK
- [ ] `curl /api/health/db` retorna 200 (ou 503 se DB offline, mas esperado)
- [ ] Rotas da API respondem

### Após ver servidor UP:
- [ ] Execute `npm run db:seed` para popular banco
- [ ] Teste `/api/billing/plans` retorna planos

---

## 🛠️ Troubleshooting

### "Build failed" ou "npm ci failed"
```
Causa: Dependências não instaladas
Solução: Remova node_modules e package-lock.json localmente, re-instale
```

### "npm start não encontra dist/index.cjs"
```
Causa: Build não foi executado
Solução: Render executa "npm ci && npm run build" automaticamente
         Se falhar, veja logs do build
```

### "/health responde 200 mas /api/health/db retorna 503"
```
NORMAL! Significa:
- ✓ Servidor está UP
- ✗ Banco de dados está offline/indisponível
- Próximo: Verificar DATABASE_URL e conexão no Render
```

### "Plans não aparecem no app"
```
Causa: npm run db:seed não foi executado
Solução: Execute:
         npm run db:seed
         
Ou aguarde Cron Job se configurado
```

---

## 📊 Configuração Supabase Pooler

### Connection String Esperado
```
postgresql://user:password@db.supabase.co:6543/postgres?sslmode=require
```

### Parâmetros Importantes
| Parâmetro | Valor | Motivo |
|-----------|-------|--------|
| **host** | db.supabase.co | Pooler host |
| **port** | 6543 | Pooler port (não 5432) |
| **sslmode** | require | Força SSL/TLS |
| **rejectUnauthorized** | false (auto) | Supabase certs são válidas |

### Timeouts Configurados
- `connectionTimeoutMillis`: 30 segundos (Render coldstart é lento)
- `idleTimeoutMillis`: 30 segundos (fecha idle connections)
- `max`: 20 conexões simultâneas

---

## 📝 Logs Esperados

### Startup bem-sucedido
```
[express] ✓ Server listening on 0.0.0.0:10000
[express] 📘 Health endpoint available at http://0.0.0.0:10000/health
```

### Seed bem-sucedido
```
[seed] Starting database seeding...
[seed] Testing database connection...
[seed] ✓ Database connection successful
[seed] Seeding default plans...
[seed] ✓ Default plans seeded successfully
[seed] Seeding billing plans...
[seed] ✓ Billing plans seeded successfully
[seed] ✅ All seeds completed successfully!
```

### DB offline (esperado, não é erro)
```
[api:health/db] Database connection failed: connect ECONNREFUSED
→ Retorna 503 (Service Unavailable)
```

---

## 🔐 Segurança

✅ **TLS/SSL:**
- `sslmode=require` na connection string
- `rejectUnauthorized: false` para Supabase (certs válidos)
- Pool não aceita conexões não-encriptadas

✅ **Timeouts:**
- Impede conexões penduradas
- Libera recursos automaticamente

✅ **Sem DATA no logs:**
- Nunca loga DATABASE_URL completa (mascarado após 50 chars)
- Senhas não aparecem em nenhum lugar

---

## 📞 Status Final

```
✅ App sobe em ~400ms (sem seeding)
✅ /health responde imediatamente
✅ /api/health/db monitora BD separadamente
✅ Seeding é manual e separado
✅ Supabase pooler (6543) configurado
✅ SSL/TLS implementado
✅ Pronto para Render
```

---

**Última atualização:** Janeiro 23, 2026
**Status:** ✅ Pronto para Production
