# Configuração do Domínio appsalvaplantao.com

Este documento descreve as alterações feitas para suportar o domínio de produção **appsalvaplantao.com**.

## Alterações Realizadas

### 1. Configuração CORS (server/index.ts)

Adicionado suporte para o domínio de produção na configuração CORS:

```typescript
// Check if hostname ends with allowed domains or is localhost
if (
  hostname === 'appsalvaplantao.com' ||
  hostname.endsWith('.appsalvaplantao.com') ||
  hostname.endsWith('.replit.app') ||
  hostname.endsWith('.repl.co') ||
  hostname === 'localhost' ||
  hostname === '127.0.0.1'
) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

**Domínios Permitidos:**
- ✅ `appsalvaplantao.com` (domínio principal)
- ✅ `*.appsalvaplantao.com` (subdomínios)
- ✅ `*.replit.app` (ambiente Replit)
- ✅ `*.repl.co` (ambiente Replit)
- ✅ `localhost` e `127.0.0.1` (desenvolvimento local)

### 2. PWA Manifest (client/public/manifest.json)

Configurado com URLs relativas para funcionar em qualquer domínio:

```json
{
  "name": "Salva Plantão",
  "start_url": "/",
  "scope": "/",
  "id": "/"
}
```

### 3. Meta Tags HTML (client/index.html)

Adicionadas meta tags essenciais para PWA e SEO:

```html
<meta name="theme-color" content="#0077b6" />
<meta name="description" content="Aplicativo médico para plantonistas - prescrições, protocolos e calculadoras" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-512.png" />
```

### 4. Arquivo .env

Criado arquivo `.env` com configuração de produção. **IMPORTANTE:** Este arquivo contém configurações sensíveis e não é commitado no git.

Variáveis mínimas necessárias:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

## Funcionalidades Implementadas

### ✅ Roteamento SPA (Single Page Application)

O servidor já está configurado para servir o `index.html` para todas as rotas não-API:

```typescript
// server/static.ts
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
```

Isso resolve o problema de "página não encontrada" ao acessar URLs diretamente ou atualizar a página.

### ✅ API Calls com URLs Relativas

Todas as chamadas de API usam URLs relativas (ex: `/api/...`), garantindo que funcionem em qualquer domínio:

```typescript
// Exemplo em client/src/lib/queryClient.ts
const res = await fetch(url, {
  method,
  headers: data ? { "Content-Type": "application/json" } : {},
  credentials: "include"
});
```

### ✅ Service Worker

O service worker está configurado e será registrado automaticamente:

```javascript
// client/src/main.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

## Deploy no Domínio de Produção

### Pré-requisitos

1. **Configurar DNS:**
   - Apontar `appsalvaplantao.com` para o servidor de produção
   - Configurar HTTPS/SSL (obrigatório para PWA)

2. **Variáveis de Ambiente:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
   JWT_SECRET=<gerar-string-aleatória-forte>
   JWT_REFRESH_SECRET=<gerar-string-aleatória-forte>
   NODE_ENV=production
   ```

3. **Build e Deploy:**
   ```bash
   npm ci
   npm run build
   npm start
   ```

### Verificação

Após o deploy, verifique:

1. **Health Check:**
   ```bash
   curl https://appsalvaplantao.com/health
   ```

2. **Roteamento:**
   - Acesse diferentes URLs diretamente: `/login`, `/dashboard`, `/prescriptions`
   - Todas devem carregar corretamente (sem 404)

3. **CORS:**
   - Verifique que requisições da API funcionam sem erros CORS no console

4. **PWA:**
   - Verifique que o manifest é carregado corretamente
   - Teste a instalação do app no dispositivo móvel

## Problemas Resolvidos

### ❌ Problema: Página não encontrada ao clicar em links
**✅ Solução:** SPA fallback configurado no servidor (`server/static.ts`)

### ❌ Problema: CORS bloqueando requisições do domínio de produção
**✅ Solução:** Domínio `appsalvaplantao.com` adicionado à lista de origens permitidas

### ❌ Problema: App não abre normalmente
**✅ Solução:** 
- Build configurado corretamente
- Rotas do cliente funcionando
- Service Worker registrado
- Manifest PWA configurado

## Contato e Suporte

Para questões técnicas ou suporte:
- Email: suporte@appsalvaplantao.com
- Domínio: https://appsalvaplantao.com

## Notas de Segurança

- ✅ Arquivo `.env` está no `.gitignore` (não será commitado)
- ✅ CORS configurado com validação segura de origem
- ✅ HTTPS obrigatório para PWA em produção
- ✅ Credenciais da API protegidas com `credentials: 'include'`
