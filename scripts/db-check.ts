#!/usr/bin/env node
/**
 * Database Connection Check Script
 * Usage: npm run db:check
 * 
 * Este script:
 * 1. Valida se DATABASE_URL está configurado
 * 2. Testa conexão com o banco de dados
 * 3. Verifica se as tabelas principais existem
 * 4. Retorna diagnóstico detalhado
 */

import { config } from "dotenv";
import path from "path";
import pg from "pg";

config({ path: path.resolve(process.cwd(), ".env") });

const { Pool } = pg;

async function checkDatabase() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  SALVA PLANTÃO - Database Connection Check            ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 1. Validar DATABASE_URL
  console.log("📋 Step 1: Validating environment variables");
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set!");
    console.error("\n💡 To fix this:");
    console.error("   1. Copy .env.example to .env");
    console.error("   2. Set DATABASE_URL with your PostgreSQL connection string");
    console.error("   3. Format: postgresql://user:password@host:port/database?sslmode=require");
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`✅ DATABASE_URL is set: ${maskedUrl}\n`);

  // 2. Parse connection details
  console.log("📋 Step 2: Parsing connection details");
  try {
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    
    console.log(`   Host: ${hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1).split('?')[0]}`);
    console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
    
    // Detect provider - check if hostname ends with known provider domains
    let provider = "Unknown";
    if (hostname.endsWith('.supabase.com') || hostname === 'supabase.com') {
      provider = "Supabase";
    } else if (hostname.endsWith('.neon.tech') || hostname === 'neon.tech') {
      provider = "Neon";
    } else if (hostname.endsWith('.render.com') || hostname === 'render.com') {
      provider = "Render";
    } else if (hostname.includes('replit')) {
      provider = "Replit DB";
    }
    
    console.log(`   Provider: ${provider}\n`);
  } catch (error) {
    console.error("⚠️  Failed to parse DATABASE_URL - might still work\n");
  }

  // 3. Test connection
  console.log("📋 Step 3: Testing database connection");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : undefined,
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log("✅ Successfully connected to database\n");

    // 4. Check PostgreSQL version
    console.log("📋 Step 4: Checking PostgreSQL version");
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log(`   ${version.split(',')[0]}\n`);

    // 5. Check tables
    console.log("📋 Step 5: Checking database schema");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log("⚠️  No tables found - database needs to be initialized");
      console.log("\n💡 To initialize the database:");
      console.log("   Run: npm run db:push");
      console.log("   Then: npm run db:seed\n");
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      
      // Key tables to check
      const keyTables = [
        'users', 
        'sessions', 
        'medications', 
        'pathologies', 
        'prescriptionModels',
        'checklists',
        'protocols'
      ];
      
      const foundTables = tablesResult.rows.map(r => r.table_name);
      const missingTables = keyTables.filter(t => !foundTables.includes(t));
      
      console.log(`   ${foundTables.slice(0, 10).join(', ')}${foundTables.length > 10 ? '...' : ''}`);
      
      if (missingTables.length > 0) {
        console.log(`\n⚠️  Missing key tables: ${missingTables.join(', ')}`);
        console.log("💡 Run: npm run db:push");
      }
      console.log();
    }

    // 6. Test write operation
    console.log("📋 Step 6: Testing write permissions");
    try {
      await client.query('CREATE TEMP TABLE _test_write (id int)');
      await client.query('DROP TABLE _test_write');
      console.log("✅ Write permissions confirmed\n");
    } catch (error: any) {
      console.error("❌ Write test failed:", error.message);
      console.error("💡 Check database user permissions\n");
    }

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║  ✅ Database Check PASSED - Ready to use!            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Database connection failed!");
    console.error(`   Error: ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.error("💡 The database host could not be found.");
      console.error("   - Check if the hostname in DATABASE_URL is correct");
      console.error("   - Verify your internet connection");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("💡 Connection was refused by the database.");
      console.error("   - Check if the database is running");
      console.error("   - Verify the port number is correct");
    } else if (error.message.includes('password')) {
      console.error("💡 Authentication failed.");
      console.error("   - Check if the username and password are correct");
    } else if (error.message.includes('SSL')) {
      console.error("💡 SSL connection issue.");
      console.error("   - Add ?sslmode=require to your DATABASE_URL");
    }
    
    console.error("\n📚 For more help, check DATABASE_SETUP.md\n");
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run check
checkDatabase().catch((err) => {
  console.error("\n❌ Unexpected error:", err);
  process.exit(1);
});
