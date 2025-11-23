// server/db/client.ts
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DB_PATH
  ? (process.env.TURSO_DB_PATH.startsWith('libsql://') 
      ? process.env.TURSO_DB_PATH 
      : `file:${process.env.TURSO_DB_PATH}`)
  : 'file:./db.sqlite'; // fallback local

const client = createClient({ url });

export default client;