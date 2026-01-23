/**
 * Image Optimization Script
 * Comprime imagens em attached_assets para reduzir tamanho de bundle
 * Executar com: npm run optimize-images
 */

import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";

async function optimizeImages() {
  const assetsDir = resolve(process.cwd(), "attached_assets");
  const outputDir = resolve(assetsDir, "optimized");

  // Criar diretório de saída se não existir
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("🖼️  Iniciando otimização de imagens...");
  console.log(`📁 Diretório: ${assetsDir}`);

  try {
    const files = await imagemin([`${assetsDir}/*.{jpg,jpeg,png,gif}`], {
      destination: outputDir,
      plugins: [
        imageminMozjpeg({
          quality: 75,
          progressive: true,
        }),
        imageminPngquant({
          quality: [0.6, 0.8],
          speed: 4,
        }),
      ],
    });

    if (files.length === 0) {
      console.log("⚠️  Nenhuma imagem encontrada para otimizar");
      return;
    }

    console.log(`\n✅ ${files.length} imagem(ns) otimizada(s):\n`);
    files.forEach((file) => {
      console.log(`   ✓ ${file}`);
    });

    console.log("\n💡 Dica: Substitua as imagens originais pelas otimizadas no diretório");
  } catch (error) {
    console.error("❌ Erro ao otimizar imagens:", error);
    process.exit(1);
  }
}

optimizeImages();
