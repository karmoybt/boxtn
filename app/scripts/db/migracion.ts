import { readFile } from 'fs/promises';
import db from '../../server/db/client';
import path from 'path';

async function run() {
  // Obtener el directorio actual del script
  const currentDir = __dirname;
  // Construir la ruta al archivo SQL
  const sqlFilePath = path.resolve(currentDir, './001-init.sql');
  
  const sql = await readFile(sqlFilePath, 'utf8');
  const stmts = sql.split(';').filter(s => s.trim());
  for (const stmt of stmts) {
    if (stmt.trim()) await db.execute(stmt);
  }
  console.log('✅ Migraciones aplicadas');
}

run().catch(console.error);