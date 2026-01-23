# 🚀 Deployment Guide - Render Configuration

## Resumo das Mudanças Implementadas

### ✅ Alterações Realizadas

#### 1. **Dependências Replit Removidas**
   - Remover 3 plugins: `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`
   - Simplificar `vite.config.ts` (removidas importações dinâmicas e condições REPL_ID)
   - App agora funciona em qualquer plataforma: Render, Heroku, DigitalOcean, etc.

#### 2. **Servidor (Node.js / Express)**
   - `server/index.ts`: Agora escuta em `0.0.0.0` em produção (Render) e `localhost` em desenvolvimento
   - Mantém suporte a `process.env.PORT` (Render injeta automaticamente)
   - Compatível com Windows (local) e Linux (Render)

#### 3. **Database Connection**
   - ✅ Sem mudanças no `server/db.ts` (já usa `process.env.DATABASE_URL` corretamente)
   - ✅ Suporta senhas com caracteres especiais (use URL-encoding: `%40` para `@`)
   - ✅ Nenhum hardcoding de hosts "helium" ou "base"
   - Validação mantida: sem DATABASE_URL, servidor não inicia

#### 4. **Segurança: JWT Secrets**
   - **Antes:** JWT_SECRET e JWT_REFRESH_SECRET tinham defaults hardcoded em desenvolvimento
   - **Depois:** Em produção, DEVEM ser configuradas via env vars (ou servidor não inicia)
   - Em desenvolvimento, exibe aviso mas permite continuar com valores temp (para testes locais)
   - Nenhum default inseguro em produção

#### 5. **Domain Resolution (Billing URLs)**
   - `server/routes.ts`: Agora tenta REPLIT_DOMAINS primeiro (compatibilidade)
   - Fallback: usa `x-forwarded-proto` header do Render + `req.headers.host` para construir URLs de callback
   - `server/auth/billingRoutes.ts`: Melhorada função `getPublishedDomain()` com fallbacks

#### 6. **Build Pipeline**
   - ✅ `npm run build`: Executa via `tsx script/build.ts` (dev)
   - ✅ `npm run start`: Executa `node dist/index.cjs` (não depende de tsx em produção)
   - esbuild já compila server para CJS, Vite bundla client para `dist/public/`

#### 7. **Configuração Render**
   - Criado `render.yaml` com config completa (opcional, pode configurar no dashboard também)
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`

#### 8. **Documentação**
   - Criado [DEPLOY.md](DEPLOY.md) com guia passo-a-passo
   - Includes troubleshooting, variáveis de ambiente, e instruções de setup local

---

## 📋 Checklist de Configuração no Render

### Passo 1: Conectar Repositório
```
1. Acesse https://render.com
2. Clique em "New +" → "Web Service"
3. Selecione seu repositório GitHub (SALVA-PLANTAO-1)
4. Branch: main (ou seu branch default)
5. Name: salva-plantao (ou seu nome preferido)
```

### Passo 2: Configurar Comandos de Build/Start
```
Build Command:    npm ci && npm run build
Start Command:    npm run start
```

### Passo 3: Configurar Variáveis de Ambiente
Adicione no dashboard do Render (Environment > Add Environment Variable):

**Variáveis Obrigatórias:**
```
NODE_ENV = production
DATABASE_URL = postgresql://user:password@host:port/database
JWT_SECRET = <generate-a-strong-random-string>
JWT_REFRESH_SECRET = <generate-another-strong-random-string>
```

**Variáveis Opcionais (caso use essas funcionalidades):**
```
AI_INTEGRATIONS_OPENAI_API_KEY = sk-...
ASAAS_API_KEY = <sua-chave-asaas>
```

### Passo 4: Configurar Database (PostgreSQL)
**Opção A: Usar Supabase/PostgreSQL Remoto**
1. Copie a CONNECTION_STRING do painel do Supabase
2. Cole como `DATABASE_URL` no Render

**Opção B: Usar PostgreSQL do Render**
1. Na página do Web Service, clique em "Create PostgreSQL"
2. Nome: `salva-plantao-db`
3. Render injetará automaticamente `DATABASE_URL`

### Passo 5: Deploy
Clique em "Deploy" e acompanhe os logs:
```
✅ Build iniciado
✅ npm ci (install dependencies)
✅ npm run build (compile TypeScript + Vite)
✅ Start Command executado
✅ Servidor ouvindo em PORT atribuído pelo Render
```

---

## 🔐 Gerando Secrets Seguros

### JWT_SECRET e JWT_REFRESH_SECRET
No terminal/PowerShell local:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

Ou use um gerador online: https://generate-random.org/

Exemplo de valor:
```
Dh7KmP9xQ2vL8nB4tY6fJ0sW3hA5eR1c2oM=
```

Gere 2 valores diferentes para JWT_SECRET e JWT_REFRESH_SECRET.

---

## 📝 DATABASE_URL com Senhas Especiais

Se sua senha PostgreSQL contém `@`, use **URL-encoding**:

| Caractere | Código |
|-----------|--------|
| `@` | `%40` |
| `#` | `%23` |
| `:` | `%3A` |
| `/` | `%2F` |

**Exemplo:**
```
Senha: password@123
URL: postgresql://user:password%40123@host:5432/database
```

---

## ✨ Verificação Local Antes de Deploy

```bash
# 1. Verificar TypeScript
npm run check

# 2. Build para produção
npm run build

# 3. Simular ambiente Render localmente
export NODE_ENV=production
export DATABASE_URL=postgresql://... # seu DATABASE_URL
export JWT_SECRET=seu_secret_aqui
export JWT_REFRESH_SECRET=outro_secret_aqui

npm run start
```

Se tudo OK, abra http://localhost:5000 (ou PORT configurada)

---

## 🐛 Troubleshooting Comum

### ❌ Erro: "DATABASE_URL is not set"
- Verifique se `DATABASE_URL` está configurada no Render Environment Variables
- Reinicie o Web Service (Deploy Latest)

### ❌ Erro: "JWT_SECRET is required in production"
- Configure `JWT_SECRET` e `JWT_REFRESH_SECRET` no Render
- Ambos são obrigatórios em production

### ❌ Erro: "Cannot find module 'openai'"
- Se não usa OpenAI: configure `AI_INTEGRATIONS_OPENAI_API_KEY` ou ignore (rotas retornarão 503)
- Se usa OpenAI: adicione a chave de API

### ❌ Erro: "SSL: certificate verify failed"
- Adicione `?sslmode=require` ao final da DATABASE_URL
- Exemplo: `postgresql://user:pass@host:5432/db?sslmode=require`

### ❌ Erro: "Connection refused" ao banco
- Verifique se o host PostgreSQL está acessível de fora
- Confirme username, password, port, database name
- Se Render: use Database interna ou Supabase/RDS externo

---

## 📦 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `package.json` | Removidas 3 @replit/* devDependencies |
| `vite.config.ts` | Removidas importações/plugins Replit |
| `server/index.ts` | Listen em 0.0.0.0 (production) vs localhost (dev) |
| `server/routes.ts` | Domain resolution melhorado com fallback |
| `server/auth/billingRoutes.ts` | getPublishedDomain() com headers support |
| `server/auth/independentAuth.ts` | JWT secrets validation (required in production) |
| `render.yaml` | **Novo** - Configuração Render |
| `DEPLOY.md` | **Novo** - Guia completo de deployment |

---

## 🎯 Próximos Passos

1. **Gere JWT secrets** (ver seção acima)
2. **Configure Render** (Environment Variables)
3. **Deploy** (clique em "Deploy")
4. **Monitore logs** (aba Logs do Render)
5. **Teste** (abra URL do Render gerada automaticamente)

---

## 📚 Referências

- [Render Docs](https://render.com/docs)
- [DEPLOY.md](./DEPLOY.md) - Guia detalhado
- `.gitignore` já exclui `.env` (seguro)

**Status:** ✅ Pronto para produção em Render
