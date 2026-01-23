# Guia de Deploy - Salva Plantão

## Ambiente Local

### Pré-requisitos
- Node.js 22+
- PostgreSQL (ou Supabase)
- npm

### Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env na raiz do projeto
# Adicionar variáveis obrigatórias:
#   - DATABASE_URL: postgresql://user:password@host:port/database
#   - NODE_ENV: development (ou production para testes)

# 3. Executar migrações do banco
npm run db:push

# 4. Iniciar servidor em desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

### Verificar Build & TypeScript

```bash
# Validar TypeScript
npm run check

# Gerar build para produção
npm run build

# Iniciar em modo produção (simular Render)
export NODE_ENV=production
npm run start
```

## Deploy no Render

### 1. Configuração Inicial no Render

#### Conectar Repositório
- Acesse [render.com](https://render.com)
- Clique em "New +" → "Web Service"
- Conecte seu repositório GitHub
- Selecione o branch `main`

#### Variáveis de Ambiente
Configure no painel do Render:

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `NODE_ENV` | `production` | ✅ Sim |
| `DATABASE_URL` | `postgresql://user:password@host:port/database` | ✅ Sim |
| `PORT` | `10000` | ❌ (Render defini automaticamente) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Sua chave OpenAI | ❌ (IA será desativada sem isso) |
| `ASAAS_API_KEY` | Sua chave Asaas (pagamentos) | ❌ |
| Outras variáveis de negócio | Conforme necessário | ❌ |

**⚠️ DATABASE_URL com senha contendo "@":**
Se sua senha tem "@", use URL-encoding: `%40` no lugar de `@`

Exemplo: `postgresql://user:pass%40word@host:port/database`

### 2. Comandos de Build e Start

O arquivo `render.yaml` (ou configuração manual) deve ter:

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start`

### 3. Database

Se usando Supabase/PostgreSQL remoto:
- Copie a `CONNECTION_STRING` do painel do banco
- Cole como `DATABASE_URL` no Render

Se usar Postgres do Render:
- Crie um "PostgreSQL Database" no Render
- Selecione a opção para conectar ao Web Service
- A `DATABASE_URL` será injetada automaticamente

### 4. Deploy Manual Alternativos

Se não usar `render.yaml`, configure manualmente:

1. No dashboard do Render, acesse **Settings**
2. Scroll até **Build & Deploy**
3. Configure:
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start`
4. Clique em **Deploy Latest**

### 5. Verificar Logs

No painel do Render:
- Clique no Web Service
- Veja a aba **Logs** para erros de build/startup
- O `npm run db:push` NÃO é executado automaticamente no Render
  - Se precisar atualizar schema: execute `npm run db:push` localmente **antes** do deploy
  - Ou conecte via SSH ao Render e execute manualmente (avançado)

## Troubleshooting

### Erro: `DATABASE_URL not set`
- Confirme que `DATABASE_URL` está configurada em Environment Variables do Render
- Reinicie o Web Service

### Erro: `Cannot find module 'openai'` ou `AI temporariamente indisponível`
- Se quiser IA: configure `AI_INTEGRATIONS_OPENAI_API_KEY`
- Se não quiser: ignore — as rotas de IA retornarão 503

### Erro: `Port já está em uso`
- O Render atribui PORT automaticamente (não usar hardcode)
- Nosso `server/index.ts` já respeita `process.env.PORT`

### Erro: `SSL: certificate verify failed` (banco)
- Se DATABASE_URL não estiver com SSL: adicione `?sslmode=require` no final da URL
- Exemplo: `postgresql://user:pass@host:port/database?sslmode=require`

## Arquitetura de Build

- **Client:** Vite (React) → `dist/public/`
- **Server:** esbuild (TypeScript) → `dist/index.cjs`
- **Start:** `node dist/index.cjs` em production

Não dependemos de `tsx` em produção (apenas em dev).

## Variáveis Importantes

### NODE_ENV
- `development` - Servidor dev com Vite, logs verbosos
- `production` - Build otimizado, logs mínimos, 0.0.0.0:PORT

### DATABASE_URL
Formato: `postgresql://username:password@host:port/database`

Suporta:
- Senhas com caracteres especiais (use URL-encoding)
- Apenas PostgreSQL (dialect: postgresql em drizzle.config.ts)

### Não suporta
- Hosts "helium" ou "base" (específicos de Replit)
- Sem DATABASE_URL: servidor não inicia

## Removido do Deploy

Dependências específicas do Replit foram removidas:
- `@replit/vite-plugin-*` (3 plugins)
- Variáveis `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN` são opcionais (fallback para headers HTTP)

O app agora funciona em qualquer host: Render, Heroku, DigitalOcean, etc.
