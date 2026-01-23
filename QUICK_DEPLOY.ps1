#!/usr/bin/env pwsh
# 🚀 QUICK START - Deploy seu Salva Plantão no Render em 5 minutos (Windows PowerShell)

Write-Host "`n════════════════════════════════════════════════════════════"
Write-Host "  SALVA PLANTÃO - QUICK START DEPLOYMENT (Windows)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════`n"

# 1. Verificar Node.js
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js não instalado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Instalar dependências
Write-Host "[2/5] Instalando dependências..." -ForegroundColor Yellow
npm ci --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependências instaladas" -ForegroundColor Green
Write-Host ""

# 3. Verificar deployment
Write-Host "[3/5] Validando configuração de deployment..." -ForegroundColor Yellow
npm run verify-deployment
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na validação" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Build
Write-Host "[4/5] Compilando aplicação..." -ForegroundColor Yellow
npm run build --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build completado" -ForegroundColor Green
Write-Host ""

# 5. Resumo
Write-Host "[5/5] Resumo final..." -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ TUDO PRONTO PARA DEPLOY!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Faça push para seu repositório:"
Write-Host "   git add ."
Write-Host "   git commit -m '🔒 Security: Fix TLS, optimize assets'"
Write-Host "   git push"
Write-Host ""

Write-Host "2. O Render fará auto-deploy via render.yaml" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Verifique os logs:" -ForegroundColor Cyan
Write-Host "   Dashboard Render → Logs"
Write-Host "   Procure por: 'Server listening on 0.0.0.0:PORT'"
Write-Host ""

Write-Host "4. Teste os endpoints:" -ForegroundColor Cyan
Write-Host "   curl https://seu-app.onrender.com/health"
Write-Host "   curl https://seu-app.onrender.com/api/health/db"
Write-Host ""

Write-Host "📚 Documentação disponível:" -ForegroundColor Magenta
Write-Host "   • RESUMO_EXECUTIVO.md - Visão geral"
Write-Host "   • SECURITY_AND_DEPLOYMENT.md - Detalhes técnicos"
Write-Host "   • TROUBLESHOOTING.md - Soluções"
Write-Host ""

Write-Host "🎉 Seu app Salva Plantão está pronto para produção!" -ForegroundColor Green
Write-Host ""
