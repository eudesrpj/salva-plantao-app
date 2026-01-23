# 🔍 DIAGNÓSTICO COMPLETO - Salva Plantão Render Production

**Data:** Janeiro 23, 2026  
**Status:** ✅ Análise concluída, remediação planejada

---

## 📋 FASE A - DIAGNÓSTICO CONCLUSÕES

### A1 ✅ Varredura Replit - CONCLUSÃO

**Replit Runtime Dependencies (CRÍTICO):**
| Arquivo | Linha | Tipo | Impacto | Ação |
|---------|-------|------|--------|------|
| `server/routes.ts` | 15-16 | Import | ⚠️ Replit integrations carregadas | Remover |
| `server/routes.ts` | 3147-3148 | Env var read | ⚠️ Tenta ler REPLIT_DOMAINS | Fallback OK, não crítico |
| `server/auth/billingRoutes.ts` | 7-10 | Env var read | ⚠️ Tenta ler REPLIT_DOMAINS | Fallback OK, não crítico |
| `server/replit_integrations/*` | múltiplos | Folder | ❌ Entire auth system depends on Replit | RISCO ALTO |
| `server/replit_integrations/auth/replitAuth.ts` | 14 | Config | ⚠️ URL hardcoded: https://replit.com/oidc | REMOVÍVEL |

**Replit Non-Runtime (Documentação - OK):**
- `replit.md` - documentação histórica
- `RENDER_SETUP.md` - instruções de migração
- `MIGRATION_IMPLEMENTATION_REPORT.md` - relatório histórico
- Comments em various files mencionando Replit

**RISCO CRÍTICO:** `server/replit_integrations/` é importado em `server/routes.ts` mas **deve ser removido ou desativado em produção**. Atualmente, auth é baseado em Replit OIDC.

**ACHADO:** Já existe `server/auth/independentAuth.ts` com comentário "NO Replit dependency" e `server/auth/authRoutes.ts`. Parece haver **duas implementações de auth paralelas**.

---

### A2 ✅ getPrescriptions Varredura - CONCLUSÃO

**Locais onde getPrescriptions é chamado:**

1. **CRÍTICO** - `server/routes.ts:1258`
   ```typescript
   app.get(api.prescriptions.list.path, authenticate, checkNotBlocked, trackUserActivity, async (req, res) => {
     const items = await storage.getPrescriptions(getUserId(req), ageGroup);
     res.json(items);
   });
   ```
   - Contexto: Rota de GET que responde a request de cliente
   - Problema: Sem timeout, sem fallback
   - Solução: ✅ Adicionar try/catch, timeout com circuit breaker

2. **CRÍTICO** - `server/routes.ts:4685`
   ```typescript
   async function seedDatabase() {
     const existing = await storage.getPrescriptions();
     if (existing.length === 0) {
       // ... cria prescriptions
     }
   }
   // E é chamado ao final de registerRoutes()
   await seedDatabase();
   ```
   - Contexto: **Executado durante registerRoutes(), ANTES do listen()**
   - Problema: **Se DB estiver down, entire startup falha, status 1**
   - Solução: ❌ MOVER para depois do listen(), envolver em try/catch, NÃO bloquear

---

### A3 ✅ Causa do Crash - CONCLUSÃO

**Erro atual em Render:**
```
SELF_SIGNED_CERT_IN_CHAIN
Connection terminated due to connection timeout
Crashes no seedDatabase() → registerRoutes() → startup fails
```

**Causa Raiz:**
1. `seedDatabase()` é executada durante `registerRoutes()` (síncrono, bloqueia)
2. Se DB falhar com timeout ou cert error, `await storage.getPrescriptions()` lança erro NÃO TRATADO
3. Erro propaga up, não há try/catch em registerRoutes(), startup falha, exit code 1
4. Render marca deploy como "failed"

**SSL/TLS Status:**
- ✅ server/db.ts já tem config de SSL correta (`rejectUnauthorized: false` para Supabase)
- ✅ sslmode=require é adicionado automaticamente
- ⚠️ Mas `getPrescriptions()` não tem timeout, se DB demora, falha

---

### A4 ✅ Config Postgres - CONCLUSÃO

**Atual em server/db.ts:**
- ✅ Pool com timeouts: `connectionTimeoutMillis: 30000`, `idleTimeoutMillis: 30000`
- ✅ SSL config: `rejectUnauthorized: false` for Supabase
- ✅ sslmode=require auto-injetado
- ✅ Pool size: `max: 20`, `min: 2`
- ✅ Error handlers: `pool.on("error")` defined
- ✅ NÃO usa NODE_TLS_REJECT_UNAUTHORIZED global

**Problema:** Pool está bem, mas **queries não têm timeout individual**. Se um SELECT demora >30s, timeout do pool não vai salvar, query fica pendurada.

---

### A5 ✅ DB Access no Startup - CONCLUSÃO

**Confirmado: `seedDatabase()` é chamada DURANTE registerRoutes(), linha 4685:**
```typescript
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuthMiddleware(app);
  registerIndependentAuthRoutes(app);
  registerAuthRoutes(app);
  registerBillingRoutes(app);
  // ... + 4700 linhas de rotas ...
  
  // LINHA 4685: seedDatabase() é AWAIT aqui!
  await seedDatabase();
  
  return httpServer;
}

// E no index.ts:
const httpServer = createServer(app);
await registerRoutes(httpServer, app);  // ← BLOQUEIA SE seedDatabase() falhar
httpServer.listen(port, host, () => { ... });
```

**Impacto:**
- Server **NÃO escuta** até registerRoutes() completar
- Se seedDatabase() demora 10s, startup leva 10s+
- Se seedDatabase() falha, **ENTIRE APP CRASHES** com status 1
- /health endpoint não responde

---

## 📊 RESUMO DE PROBLEMAS IDENTIFICADOS

| ID | Severidade | Problema | Causa | Solução |
|----|-----------|----------|-------|---------|
| P1 | 🔴 CRÍTICO | `seedDatabase()` bloqueia startup | Chamado em registerRoutes() com await | Mover para após listen(), setImmediate(), envolver em try/catch |
| P2 | 🔴 CRÍTICO | Sem tratamento de erro em seedDatabase | Erro propaga, crash startup | Adicionar try/catch, não re-throw |
| P3 | 🟡 ALTO | `getPrescriptions()` sem timeout | Query pode demorar infinitamente | Implementar timeout com Promise.race, 10s max |
| P4 | 🟡 ALTO | Replit imports em routes.ts (chat, image) | `registerChatRoutes`, `registerImageRoutes` do replit_integrations | Remover imports, desativar chamadas, ou substituir por no-op |
| P5 | 🟡 ALTO | Duas implementações de auth paralelas | `independentAuth.ts` + `replit_integrations/auth` | Consolidar em uma única implementação (independentAuth) |
| P6 | 🟡 MÉDIO | REPLIT_DOMAINS env var é lido em produção | Em billingRoutes.ts, routes.ts | OK (há fallback), mas remover quando suportar Render domains |
| P7 | 🟡 MÉDIO | /health endpoint não testa DB | Retorna 200 sempre | ✅ JÁ TEM `/api/health/db` que retorna 503 se down |
| P8 | 🟢 BAIXO | Documentação menciona Replit | replit.md, etc. | OK (documentação), manter para histórico |

---

## ✅ VERIFICAÇÕES POSITIVAS

- ✅ `/health` endpoint já existe e sempre retorna 200
- ✅ `/api/health/db` endpoint já existe e retorna 503 se DB falhar
- ✅ `server/db.ts` tem SSL config correta
- ✅ `server/index.ts` está estruturado corretamente (async IIFE)
- ✅ independentAuth.ts existe como alternativa sem Replit
- ✅ pool error handlers já implementados
- ✅ package.json não tem NODE_TLS_REJECT_UNAUTHORIZED em scripts

---

## 🚀 PLANO EXECUÇÃO - FASE B (PRÓXIMAS MUDANÇAS)

### Prioridade 1: Remover seedDatabase blocking (P1)
- [ ] Mover `seedDatabase()` para APÓS `httpServer.listen()`
- [ ] Envolver em `setImmediate(() => { ... })` com try/catch
- [ ] Mudar erro para log, não crash

### Prioridade 2: Proteger getPrescriptions (P3)
- [ ] Implementar `dbTimeout(promise, ms)` utility
- [ ] Envolver `storage.getPrescriptions()` com timeout 10s
- [ ] Se timeout, retornar erro 503 + mensagem
- [ ] NÃO crashes o app

### Prioridade 3: Limpar Replit imports (P4)
- [ ] Remover `registerChatRoutes` e `registerImageRoutes` de routes.ts
- [ ] OU: Verificar se são necessárias e consolidar em auth independente
- [ ] Atualmente apontam para `server/replit_integrations/chat` e `server/replit_integrations/image`

### Prioridade 4: Consolidar Auth (P5)
- [ ] Verificar qual auth está sendo usada (independentAuth ou replit_integrations)
- [ ] Se estiver usando independentAuth, remover imports do replit_integrations
- [ ] Se estiver usando ambas, escolher uma e limpar a outra

### Prioridade 5: Adicionar testes (C1, C2)
- [ ] Criar testes para /health (sempre 200)
- [ ] Criar teste para /api/health/db (200 ou 503)
- [ ] Criar smoke test script

---

## 📝 PRÓXIMO PASSO

Aguardando confirmação para executar **FASE B - CORREÇÕES PRIORITÁRIAS**

