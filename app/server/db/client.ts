// server/db/client.ts
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:'+process.env.TURSO_DB_PATH,
});

export default client;