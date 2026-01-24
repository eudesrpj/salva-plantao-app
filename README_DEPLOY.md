# 📘 README - Guia de Deploy e Configuração

## 🎯 Visão Geral

**Salva Plantão** é uma aplicação web full-stack para gestão de plantões médicos, com:
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT + HttpOnly Cookies (independente, sem Replit)
- **Pagamentos:** Integração com ASAAS

---

## 📦 Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 8

---

## 🚀 Deploy em Produção

### Opção 1: Monolito em Render (Recomendado)

O app está configurado para deploy completo (frontend + backend) no Render.

**Passos:**

1. **Criar Banco de Dados no Render**
   - Vá para [Render Dashboard](https://dashboard.render.com)
   - New → PostgreSQL
   - Nome: `salva-plantao-db`
   - Region: Oregon (US West)
   - Plan: Starter ($7/mês) ou Free
   - Copie o `Internal Database URL` 

2. **Criar Web Service no Render**
   - New → Web Service
   - Conecte ao repositório GitHub
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment: Node

3. **Configurar Variáveis de Ambiente**

   **Obrigatórias:**
   ```
   DATABASE_URL=<Internal Database URL do Render>
   JWT_SECRET=<gerar com: openssl rand -base64 32>
   JWT_REFRESH_SECRET=<gerar com: openssl rand -base64 32>
   SESSION_SECRET=<gerar com: openssl rand -base64 32>
   NODE_ENV=production
   ```

   **Opcionais (mas recomendadas):**
   ```
   ASAAS_API_KEY=<sua API key do ASAAS>
   ASAAS_SANDBOX=false
   AI_INTEGRATIONS_OPENAI_API_KEY=<sua API key OpenAI>
   VAPID_PUBLIC_KEY=<gerar com: npx web-push generate-vapid-keys>
   VAPID_PRIVATE_KEY=<gerar junto com public key>
   VAPID_SUBJECT=mailto:admin@appsalvaplantao.com
   ```

4. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o build e deploy (5-10 minutos)
   - Acesse a URL fornecida pelo Render

5. **Configurar Webhook ASAAS** (se usar ASAAS)
   - No painel ASAAS, configure o webhook:
   - URL: `https://seu-app.onrender.com/api/webhooks/asaas`
   - Eventos: 
     - PAYMENT_CONFIRMED
     - PAYMENT_RECEIVED
     - PAYMENT_OVERDUE
     - PAYMENT_UPDATED
     - PAYMENT_DELETED
     - PAYMENT_REFUNDED

---

### Opção 2: Frontend (Vercel) + Backend (Render)

**Backend no Render:**
- Siga os passos acima, mas ajuste o Start Command:
  ```
  npm run start
  ```

**Frontend no Vercel:**
1. Conecte repositório no Vercel
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist/public`
5. Variáveis de ambiente:
   ```
   VITE_API_URL=https://seu-backend.onrender.com
   ```

**CORS:** Configure CORS no backend para aceitar requisições do domínio Vercel.

---

## 💻 Desenvolvimento Local

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar .env
Copie o arquivo `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
# Banco de dados local
DATABASE_URL=postgresql://user:password@localhost:5432/salvaplantao

# Secrets (gerar com: openssl rand -base64 32)
JWT_SECRET=seu-secret-aqui-min-32-chars
JWT_REFRESH_SECRET=seu-refresh-secret-aqui-min-32-chars
SESSION_SECRET=seu-session-secret-aqui-min-32-chars

# Ambiente
NODE_ENV=development
PORT=5000

# ASAAS (sandbox para testes)
ASAAS_API_KEY=sua-api-key-sandbox
ASAAS_SANDBOX=true
```

### 3. Criar Banco de Dados
```bash
# Via psql
createdb salvaplantao

# Ou via Docker
docker run --name postgres-salvaplantao \
  -e POSTGRES_PASSWORD=senha \
  -e POSTGRES_DB=salvaplantao \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Aplicar Migrations
```bash
npm run db:push
```

### 5. (Opcional) Seed Database
```bash
npm run db:seed
```

### 6. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Gerando Secrets

### JWT Secrets
```bash
# Gerar JWT_SECRET
openssl rand -base64 32

# Gerar JWT_REFRESH_SECRET
openssl rand -base64 32

# Gerar SESSION_SECRET
openssl rand -base64 32
```

### VAPID Keys (WebPush)
```bash
npx web-push generate-vapid-keys
```

---

## 🔧 Variáveis de Ambiente - Referência Completa

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `DATABASE_URL` | ✅ Sim | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Sim (prod) | - | Secret para JWT tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ Sim (prod) | - | Secret para refresh tokens (min 32 chars) |
| `SESSION_SECRET` | ✅ Sim (prod) | - | Secret para sessões (min 32 chars) |
| `NODE_ENV` | ❌ Não | `development` | `development` ou `production` |
| `PORT` | ❌ Não | `5000` | Porta do servidor |
| `ASAAS_API_KEY` | ⚠️ Recomendada | - | API key do ASAAS para pagamentos |
| `ASAAS_SANDBOX` | ❌ Não | `true` | `true` para sandbox, `false` para produção |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ❌ Não | - | API key OpenAI para funcionalidades de IA |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ❌ Não | - | URL customizada para OpenAI (opcional) |
| `VAPID_PUBLIC_KEY` | ❌ Não | - | Chave pública VAPID para push notifications |
| `VAPID_PRIVATE_KEY` | ❌ Não | - | Chave privada VAPID para push notifications |
| `VAPID_SUBJECT` | ❌ Não | - | Email de contato para VAPID |
| `POSTGRES_ALLOW_SELF_SIGNED` | ❌ Não | - | `true` apenas para dev com certificados self-signed |
| `ENCRYPTION_KEY` | ❌ Não | `SESSION_SECRET` | Chave de criptografia (fallback para SESSION_SECRET) |

---

## 🔐 Segurança

### Boas Práticas Implementadas

✅ **Autenticação:**
- JWT com refresh token (7 dias)
- HttpOnly cookies (não acessíveis via JavaScript)
- Secure flag em produção (HTTPS only)
- Bcrypt para hashing de senhas

✅ **Logging:**
- Sanitização automática de dados sensíveis
- Logs estruturados em JSON
- Sem exposição de secrets

✅ **Validação:**
- Env vars validadas no boot
- Zod para validação de requisições
- Mensagens de erro claras sem expor detalhes internos

✅ **Database:**
- Prepared statements (Drizzle ORM protege contra SQL injection)
- SSL em produção
- Timeout nas queries (10s)

### Checklist de Segurança

- [ ] Secrets gerados com `openssl rand -base64 32`
- [ ] `NODE_ENV=production` em produção
- [ ] `ASAAS_SANDBOX=false` em produção
- [ ] HTTPS configurado (automático no Render)
- [ ] Webhook ASAAS configurado com a URL correta
- [ ] Database URL usando SSL (`?sslmode=require`)
- [ ] Secrets NÃO commitados no Git (.env no .gitignore)

---

## 🧪 Testes

### Build
```bash
npm run build
```

### Type Check
```bash
npm run check
```

### Smoke Test
```bash
npm run smoke
```

---

## 📊 Health Checks

### Endpoint: `/health`
```bash
curl http://localhost:5000/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-23T12:34:56.789Z",
  "version": "1.0.0",
  "auth": "independent",
  "node": "v18.x.x"
}
```

### Endpoint: `/api/health/db`
```bash
curl http://localhost:5000/api/health/db
```

Resposta (sucesso):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-23T12:34:56.789Z",
  "database": "postgresql"
}
```

Resposta (falha):
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-23T12:34:56.789Z",
  "error": "Database connection failed",
  "details": "connection timeout"
}
```

---

## 🐛 Troubleshooting

### Erro: "Environment variable validation failed"

**Causa:** Variáveis obrigatórias faltando no .env

**Solução:**
1. Copie `.env.example` para `.env`
2. Preencha as variáveis obrigatórias:
   - DATABASE_URL
   - JWT_SECRET (min 32 chars)
   - JWT_REFRESH_SECRET (min 32 chars)
   - SESSION_SECRET (min 32 chars)

### Erro: "Database connection failed"

**Causa:** DATABASE_URL incorreta ou banco indisponível

**Solução:**
1. Verifique se PostgreSQL está rodando
2. Teste a conexão: `psql $DATABASE_URL`
3. Verifique SSL mode: adicione `?sslmode=require` na URL

### Erro: "Port 5000 already in use"

**Solução:**
```bash
# Mude a porta no .env
PORT=3000

# Ou mate o processo usando a porta
lsof -ti:5000 | xargs kill -9
```

### Webhook ASAAS não funciona

**Checklist:**
1. URL configurada corretamente no painel ASAAS
2. HTTPS habilitado (obrigatório para webhooks)
3. Endpoint acessível publicamente
4. Verifique logs: `POST /api/webhooks/asaas`

---

## 📞 Suporte

- **Email:** suporte@appsalvaplantao.com
- **Documentação:** Ver arquivos markdown na raiz do projeto
- **Issues:** GitHub Issues

---

## 📝 Licença

© Salva Plantão - Uso não autorizado é proibido.

---

**Última atualização:** Janeiro 2026
