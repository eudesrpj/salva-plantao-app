#!/usr/bin/env node
/**
 * Pre-Deployment Verification Script
 * Valida configurações de segurança e performance antes de deploy no Render
 */

import { readFile, access } from "fs/promises";
import { constants } from "fs";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

async function checkFile(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function verifyDeployment() {
  console.log(
    `\n${colors.blue}🔍 Verificando configuração de deployment...${colors.reset}\n`,
  );

  let passed = 0;
  let failed = 0;

  // Check 1: package.json scripts
  console.log("1️⃣  Verificando scripts de start...");
  try {
    const pkg = JSON.parse(
      await readFile("package.json", "utf-8"),
    );

    if (
      pkg.scripts &&
      pkg.scripts.start === "cross-env NODE_ENV=production node dist/index.cjs"
    ) {
      console.log(
        `   ${colors.green}✓${colors.reset} Script de start removeu NODE_TLS_REJECT_UNAUTHORIZED\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.red}✗${colors.reset} Script de start pode estar inseguro\n`,
      );
      failed++;
    }

    if (
      pkg.scripts &&
      pkg.scripts.dev ===
        "cross-env NODE_ENV=development tsx server/index.ts"
    ) {
      console.log(
        `   ${colors.green}✓${colors.reset} Script dev removeu NODE_TLS_REJECT_UNAUTHORIZED\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.red}✗${colors.reset} Script dev pode estar inseguro\n`,
      );
      failed++;
    }
  } catch (e) {
    console.log(
      `   ${colors.red}✗${colors.reset} Erro ao ler package.json\n`,
    );
    failed++;
  }

  // Check 2: vite.config.ts with optimization
  console.log("2️⃣  Verificando configuração Vite...");
  const hasViteConfig = await checkFile("vite.config.ts");
  if (hasViteConfig) {
    const viteContent = await readFile("vite.config.ts", "utf-8");
    if (viteContent.includes("ViteImagemin")) {
      console.log(
        `   ${colors.green}✓${colors.reset} Plugin imagemin configurado\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.yellow}⚠${colors.reset} Plugin imagemin não encontrado (opcional)\n`,
      );
    }

    if (viteContent.includes("manualChunks")) {
      console.log(
        `   ${colors.green}✓${colors.reset} manualChunks configurado para otimização\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.red}✗${colors.reset} manualChunks não configurado\n`,
      );
      failed++;
    }
  } else {
    console.log(
      `   ${colors.red}✗${colors.reset} vite.config.ts não encontrado\n`,
    );
    failed++;
  }

  // Check 3: server/db.ts with secure TLS
  console.log("3️⃣  Verificando configuração de banco de dados...");
  const hasDbConfig = await checkFile("server/db.ts");
  if (hasDbConfig) {
    const dbContent = await readFile("server/db.ts", "utf-8");
    if (dbContent.includes("sslmode=require")) {
      console.log(
        `   ${colors.green}✓${colors.reset} SSL/TLS configurado com sslmode=require\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.yellow}⚠${colors.reset} sslmode=require não encontrado\n`,
      );
    }

    if (dbContent.includes("rejectUnauthorized")) {
      console.log(
        `   ${colors.green}✓${colors.reset} Validação de certificados configurada\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.red}✗${colors.reset} Validação de certificados não configurada\n`,
      );
      failed++;
    }
  } else {
    console.log(
      `   ${colors.red}✗${colors.reset} server/db.ts não encontrado\n`,
    );
    failed++;
  }

  // Check 4: server/index.ts cleanup
  console.log("4️⃣  Verificando server/index.ts...");
  const hasServerFile = await checkFile("server/index.ts");
  if (hasServerFile) {
    const serverContent = await readFile("server/index.ts", "utf-8");
    if (!serverContent.includes("NODE_TLS_REJECT_UNAUTHORIZED")) {
      console.log(
        `   ${colors.green}✓${colors.reset} NODE_TLS_REJECT_UNAUTHORIZED removido\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.red}✗${colors.reset} NODE_TLS_REJECT_UNAUTHORIZED ainda presente\n`,
      );
      failed++;
    }
  }

  // Check 5: render.yaml
  console.log("5️⃣  Verificando configuração Render...");
  const hasRenderYaml = await checkFile("render.yaml");
  if (hasRenderYaml) {
    const renderContent = await readFile("render.yaml", "utf-8");
    if (
      renderContent.includes("npm run start") &&
      !renderContent.includes("NODE_TLS_REJECT_UNAUTHORIZED")
    ) {
      console.log(
        `   ${colors.green}✓${colors.reset} render.yaml seguro\n`,
      );
      passed++;
    } else {
      console.log(
        `   ${colors.yellow}⚠${colors.reset} Revisar render.yaml\n`,
      );
    }
  } else {
    console.log(
      `   ${colors.yellow}⚠${colors.reset} render.yaml não encontrado\n`,
    );
  }

  // Check 6: Dependencies
  console.log("6️⃣  Verificando dependências...");
  try {
    const pkg = JSON.parse(
      await readFile("package.json", "utf-8"),
    );

    const prodDeps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    const criticalDeps = [
      "express",
      "pg",
      "drizzle-orm",
      "react",
      "react-dom",
    ];

    let criticalOk = true;
    for (const dep of criticalDeps) {
      if (!prodDeps.includes(dep)) {
        console.log(
          `   ${colors.red}✗${colors.reset} ${dep} não está em dependencies\n`,
        );
        criticalOk = false;
        failed++;
      }
    }

    if (criticalOk) {
      console.log(
        `   ${colors.green}✓${colors.reset} Todas as dependências críticas estão em dependencies\n`,
      );
      passed++;
    }

    if (devDeps.includes("vite-plugin-imagemin")) {
      console.log(
        `   ${colors.green}✓${colors.reset} vite-plugin-imagemin adicionado\n`,
      );
      passed++;
    }
  } catch (e) {
    console.log(
      `   ${colors.red}✗${colors.reset} Erro ao verificar dependências\n`,
    );
    failed++;
  }

  // Summary
  console.log(
    `\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.green}✓ Passou: ${passed}${colors.reset} | ${colors.red}✗ Falhou: ${failed}${colors.reset}`,
  );
  console.log(
    `${colors.blue}═══════════════════════════════════════════════════${colors.reset}\n`,
  );

  if (failed === 0) {
    console.log(
      `${colors.green}✅ Deployment está pronto para produção!${colors.reset}\n`,
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.red}❌ Existem problemas a resolver antes do deployment.${colors.reset}\n`,
    );
    process.exit(1);
  }
}

verifyDeployment().catch((err) => {
  console.error(`${colors.red}Erro:${colors.reset}`, err);
  process.exit(1);
});
