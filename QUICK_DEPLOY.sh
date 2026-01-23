#!/usr/bin/env bash
# 🚀 QUICK START - Deploy seu Salva Plantão no Render em 5 minutos

echo "════════════════════════════════════════════════════════════"
echo "  SALVA PLANTÃO - QUICK START DEPLOYMENT"
echo "════════════════════════════════════════════════════════════"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "${YELLOW}[1/5]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo ""

# 2. Instalar dependências
echo -e "${YELLOW}[2/5]${NC} Instalando dependências..."
npm ci --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# 3. Verificar deployment
echo -e "${YELLOW}[3/5]${NC} Validando configuração de deployment..."
npm run verify-deployment
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro na validação${NC}"
    exit 1
fi
echo ""

# 4. Build
echo -e "${YELLOW}[4/5]${NC} Compilando aplicação..."
npm run build --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completado${NC}"
echo ""

# 5. Resumo
echo -e "${YELLOW}[5/5]${NC} Resumo final..."
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TUDO PRONTO PARA DEPLOY!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Faça push para seu repositório:"
echo "   git add ."
echo "   git commit -m '🔒 Security: Fix TLS, optimize assets'"
echo "   git push"
echo ""
echo "2. O Render fará auto-deploy via render.yaml"
echo ""
echo "3. Verifique os logs:"
echo "   Dashboard Render → Logs"
echo "   Procure por: 'Server listening on 0.0.0.0:PORT'"
echo ""
echo "4. Teste os endpoints:"
echo "   curl https://seu-app.onrender.com/health"
echo "   curl https://seu-app.onrender.com/api/health/db"
echo ""
echo "📚 Documentação disponível:"
echo "   • RESUMO_EXECUTIVO.md - Visão geral"
echo "   • SECURITY_AND_DEPLOYMENT.md - Detalhes técnicos"
echo "   • TROUBLESHOOTING.md - Soluções"
echo ""
echo "🎉 Seu app Salva Plantão está pronto para produção!"
echo ""
