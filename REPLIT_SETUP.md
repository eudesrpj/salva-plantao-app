# 🚀 Guia de Setup - Replit

## ✅ Resumo da Migração

Este app foi **adaptado para rodar no Replit** mantendo TODAS as funcionalidades atuais:
- ✅ Login próprio (email + código de 6 dígitos) - SEM Replit Auth
- ✅ Integração ASAAS (pagamentos)
- ✅ Painel Admin completo
- ✅ Chat interno, WebSocket, notificações
- ✅ Banco de dados PostgreSQL externo

---

## 📋 Variáveis de Ambiente Necessárias

Configure estas variáveis no painel **Secrets** do Replit:

### Obrigatórias

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication (gere strings aleatórias fortes)
JWT_SECRET=sua-chave-secreta-forte-aqui-min-32-chars
JWT_REFRESH_SECRET=outra-chave-secreta-diferente-min-32-chars

# Node Environment
NODE_ENV=production
```

### Opcionais (somente se usar as funcionalidades)

```bash
# Pagamentos ASAAS
ASAAS_API_KEY=sua-chave-asaas
ASAAS_SANDBOX=false  # true para sandbox, false para produção

# AI Assistant (OpenAI)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Email (se implementar envio real)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
```

---

## 🔧 Porta Utilizada

O app usa **automaticamente** a porta fornecida pelo Replit via `process.env.PORT`.
- Não é necessário configurar manualmente
- Fallback para porta 5000 em desenvolvimento local

---

## 🏃 Comandos de Start

### Desenvolvimento (com HMR)
```bash
npm run dev
```
- Inicia servidor com hot reload
- Vite dev server para frontend
- tsx watch para backend
- Acesse via URL do Replit: `https://seu-repl.replit.app`

### Produção
```bash
npm run build && npm run start
```
- Build completo (server + client)
- Servidor otimizado sem tsx
- Recomendado para deploy final

---

## 🗄️ Database Setup

### Opção A: PostgreSQL Externo (Recomendado)

Use um banco PostgreSQL externo como:
- **Supabase** (gratuito, 500MB)
- **Neon** (gratuito, serverless)
- **Railway** (gratuito, 500MB)
- **Render PostgreSQL**

**Passos:**
1. Crie um database PostgreSQL em um desses serviços
2. Copie a **Connection String** (formato: `postgresql://...`)
3. Adicione no Replit Secrets como `DATABASE_URL`
4. Certifique-se que a string contém `?sslmode=require` no final

### Opção B: Replit PostgreSQL (Limitado)

O Replit oferece PostgreSQL embutido, mas com limitações:
- Pode ser reiniciado/limpo periodicamente
- Não recomendado para produção

---

## 🔒 Autenticação e Login

### Como Funciona

1. Usuário acessa `/login`
2. Digita email
3. Recebe código de 6 dígitos por email (atualmente simulado no console)
4. Insere código ou clica no link mágico
5. JWT criado e armazenado em HttpOnly cookie
6. Sessão válida por 7 dias (refresh token)

### ⚠️ Importante

- **NÃO usa Replit Auth**
- **NÃO redireciona para replit.com/login**
- Login é 100% independente e customizado

---

## 💳 Integração ASAAS (Pagamentos)

### Configuração

1. Obtenha sua API Key no [painel ASAAS](https://www.asaas.com)
2. Adicione `ASAAS_API_KEY` nos Secrets do Replit
3. Configure `ASAAS_SANDBOX=false` para produção

### Webhooks

Para receber notificações de pagamento confirmado:
1. No painel ASAAS, configure o webhook para:
   ```
   https://seu-repl.replit.app/api/billing/webhook
   ```
2. Eventos recomendados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`

---

## 🐛 Troubleshooting

### Erro: "JWT secrets not configured"

**Causa:** `JWT_SECRET` ou `JWT_REFRESH_SECRET` não definidos.

**Solução:**
1. Gere duas strings aleatórias fortes (mínimo 32 caracteres)
2. Adicione nos Secrets do Replit
3. Reinicie o Repl

**Como gerar:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Erro: "DATABASE_URL must be set"

**Causa:** Variável `DATABASE_URL` não configurada.

**Solução:**
1. Crie um database PostgreSQL (veja seção Database Setup)
2. Copie a connection string
3. Adicione como `DATABASE_URL` nos Secrets
4. Formato esperado: `postgresql://user:pass@host:port/db?sslmode=require`

---

### Erro 500 no login / cookies não funcionam

**Causa:** Problemas com cookies no Replit proxy.

**Soluções já implementadas:**
- ✅ `sameSite: "lax"` para compatibilidade com proxy
- ✅ `trust proxy` configurado no Express
- ✅ CORS habilitado para `*.replit.app`

**Se persistir:**
1. Verifique se está acessando via HTTPS (Replit usa HTTPS por padrão)
2. Limpe cookies do navegador
3. Teste em janela anônima

---

### Erro: "SELF_SIGNED_CERT_IN_CHAIN" no database

**Causa:** Certificado SSL do database não é confiável.

**Solução já implementada:**
- ✅ `rejectUnauthorized: false` configurado no `server/db.ts`
- ✅ `sslmode=require` na connection string

**Verificar:**
- Connection string deve ter `?sslmode=require` no final

---

### App lento ou caindo

**Causas possíveis:**
1. Replit free tier hiberna após inatividade
2. Database externo com latência alta
3. Build não otimizado

**Soluções:**
1. Use Replit Always-On (plano pago) para produção
2. Escolha database na mesma região (ex: US)
3. Execute `npm run build` antes de produção

---

## 📝 Observações Importantes para Produção

### 1. Secrets Management
- ❌ Nunca commite arquivos `.env` com secrets
- ✅ Use sempre o painel Secrets do Replit
- ✅ Secrets são injetados como environment variables

### 2. Database Backups
- Configure backups automáticos no seu provedor de database
- Supabase e Neon oferecem backups gratuitos

### 3. Logs e Monitoramento
- Logs aparecem no console do Replit
- Considere usar serviços como Sentry para error tracking
- Health check disponível em: `/health` e `/api/health/db`

### 4. Performance
- Em produção, use sempre `npm run build && npm run start`
- Evite `npm run dev` em produção (mais lento, sem otimizações)
- Considere CDN para assets estáticos (futuro)

### 5. Webhooks
- Configure domínio customizado no Replit (plano pago) para webhooks estáveis
- URL padrão do Replit pode mudar: `https://seu-repl.replit.app`

---

## ✅ Checklist de Deploy

- [ ] Criar Repl no Replit
- [ ] Conectar ao repositório GitHub
- [ ] Configurar todas as variáveis obrigatórias nos Secrets
- [ ] Criar database PostgreSQL externo
- [ ] Configurar `DATABASE_URL` nos Secrets
- [ ] Executar `npm install` (Replit faz automático)
- [ ] Executar `npm run build` para build inicial
- [ ] Clicar em "Run" (executa `npm run dev` por padrão)
- [ ] Testar login em `/login`
- [ ] Verificar health check em `/health`
- [ ] Configurar webhooks ASAAS (se aplicável)
- [ ] Testar fluxo completo: login → pagamento → acesso

---

## 🆘 Suporte

- **Email oficial:** suporte@appsalvaplantao.com
- **GitHub Issues:** Para bugs e problemas técnicos
- **Documentação adicional:** Ver arquivos `*.md` no repositório

---

## 🎉 Deploy Bem-Sucedido?

Se o app estiver rodando sem erros:
1. ✅ Login funcionando
2. ✅ Admin acessível
3. ✅ Database conectado
4. ✅ Sem erros 500 no console

**Parabéns! 🎊 O app está rodando no Replit com sucesso!**

---

**Última atualização:** Janeiro 2026  
**Versão:** 2.7 (Custom Auth + ASAAS Integration)
