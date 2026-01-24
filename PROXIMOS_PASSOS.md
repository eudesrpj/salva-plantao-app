# 🚀 Próximos Passos - Deploy no Replit

## ✅ Migração Completa!

O código do **Salva Plantão** foi **totalmente adaptado** para rodar no Replit, mantendo todas as funcionalidades atuais.

---

## 📦 O Que Foi Feito

### Adaptações Técnicas
1. ✅ **Cookies**: sameSite alterado para "lax" (compatível com proxy Replit)
2. ✅ **Trust Proxy**: Express configurado para ler headers X-Forwarded-*
3. ✅ **CORS**: Middleware adicionado para *.replit.app e *.repl.co
4. ✅ **Configuração**: Arquivo `.replit` criado com Node.js v20
5. ✅ **Build**: Testado e funcionando (dist/index.cjs + dist/public/)
6. ✅ **Documentação**: Guias completos criados

### Garantias
- ✅ Login próprio (email + código) 100% funcional
- ✅ ASAAS integration intacta
- ✅ Admin panel preservado
- ✅ WebSocket e chat funcionando
- ✅ Database PostgreSQL externo compatível
- ✅ ZERO mudanças em lógica de negócio

---

## 🎯 Como Fazer o Deploy no Replit

### Passo 1: Criar o Repl
1. Acesse [replit.com](https://replit.com)
2. Clique em **"Create Repl"**
3. Escolha **"Import from GitHub"**
4. Cole a URL do seu repositório
5. Aguarde a importação

### Passo 2: Configurar Secrets (Variáveis de Ambiente)

Clique no ícone de **🔒 Secrets** no painel lateral e adicione:

#### Obrigatórias:
```
DATABASE_URL = postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET = [gere uma string aleatória de 32+ caracteres]
JWT_REFRESH_SECRET = [gere outra string diferente de 32+ caracteres]
NODE_ENV = production
```

#### Como gerar JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Opcionais (se usar as features):
```
ASAAS_API_KEY = [sua chave ASAAS]
AI_INTEGRATIONS_OPENAI_API_KEY = [sua chave OpenAI]
```

### Passo 3: Instalar Dependências
No shell do Replit:
```bash
npm install
```

### Passo 4: Build
```bash
npm run build
```

### Passo 5: Rodar o App
Clique no botão **▶️ Run** no topo da tela.

O Replit executará automaticamente: `npm run dev`

### Passo 6: Acessar o App
- A URL será exibida no painel **Webview**
- Formato: `https://seu-repl-nome.seu-usuario.repl.co`
- Acesse `/login` para testar o login

---

## 🗄️ Configurar Database PostgreSQL

### Opção A: Supabase (Recomendado - Gratuito)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Em **Settings → Database**:
   - Copie a **Connection String** (modo Pooler, porta 6543)
   - Certifique-se que termina com `?sslmode=require`
4. Cole no Replit Secrets como `DATABASE_URL`

### Opção B: Neon (Serverless PostgreSQL)

1. Acesse [neon.tech](https://neon.tech)
2. Crie um database
3. Copie a connection string
4. Cole no Replit Secrets

### Opção C: Render PostgreSQL

1. Crie um database no [render.com](https://render.com)
2. Copie a **Internal Connection String**
3. Cole no Replit Secrets

---

## 🧪 Testar o App

### 1. Health Check
```
https://seu-repl.repl.co/health
```
Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T...",
  "auth": "independent",
  "node": "v20.x.x"
}
```

### 2. Database Health
```
https://seu-repl.repl.co/api/health/db
```
Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T...",
  "database": "postgresql"
}
```

### 3. Login
1. Acesse: `https://seu-repl.repl.co/login`
2. Digite um email
3. Verifique o console do Replit para o código de 6 dígitos (email simulado)
4. Insira o código
5. Deve redirecionar para `/` com login efetuado

---

## 💳 Configurar ASAAS (Pagamentos)

### 1. Obter API Key
1. Acesse [asaas.com](https://asaas.com)
2. Entre ou crie uma conta
3. Vá em **Integrações → API Key**
4. Copie sua Production API Key

### 2. Adicionar no Replit
```
ASAAS_API_KEY = [sua_chave_aqui]
ASAAS_SANDBOX = false
```

### 3. Configurar Webhook
No painel ASAAS, configure webhook para:
```
https://seu-repl.repl.co/api/billing/webhook
```

Eventos:
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_RECEIVED

---

## 🐛 Troubleshooting

### Erro: "JWT secrets not configured"
**Solução:** Adicione `JWT_SECRET` e `JWT_REFRESH_SECRET` nos Secrets.

### Erro: "DATABASE_URL must be set"
**Solução:** Configure `DATABASE_URL` nos Secrets com formato correto.

### Cookies não funcionam / Erro 401
**Solução:** 
- Limpe cookies do navegador
- Teste em janela anônima
- Verifique se está acessando via HTTPS (Replit usa HTTPS por padrão)

### Build falha
**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentação Completa

- **`REPLIT_SETUP.md`**: Guia detalhado com troubleshooting
- **`.env.example`**: Template de todas as variáveis
- **`.replit`**: Configuração do ambiente (já criada)

---

## ✅ Checklist de Deploy

- [ ] Repl criado e código importado
- [ ] `DATABASE_URL` configurada nos Secrets
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` gerados e configurados
- [ ] `NODE_ENV=production` configurado
- [ ] `npm install` executado
- [ ] `npm run build` executado
- [ ] App rodando via **Run** button
- [ ] `/health` retorna OK
- [ ] `/api/health/db` retorna healthy
- [ ] Login testado e funcionando
- [ ] ASAAS configurado (se aplicável)
- [ ] Webhook ASAAS apontando para o Repl

---

## 🆘 Suporte

**Email:** suporte@appsalvaplantao.com

**Documentação:**
- `REPLIT_SETUP.md` - Setup completo
- `replit.md` - Arquitetura do app
- `README.md` - Overview geral

---

## 🎉 Sucesso!

Se todos os checks acima passarem, o app está **100% funcional no Replit**! 🚀

**Próximo passo:** Compartilhe a URL com seus usuários e comece a usar!

---

**Última atualização:** Janeiro 2026  
**Versão:** 2.7 (Replit Migration Complete)
