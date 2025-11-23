// server/db/audit.ts
import client from '~/server/db/client';

export async function writeAuditLog({
  usuario_id,
  accion,
  tabla,
  registro_id,
  valor_anterior,
  valor_nuevo,
  ip,
  user_agent
}: {
  usuario_id?: string;
  accion: string;
  tabla: string;
  registro_id: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  ip?: string;
  user_agent?: string;
}) {
  const id = crypto.randomUUID(); // o import { randomUUID } from 'node:crypto'

  const query = `
    INSERT INTO logs_auditoria (
      id, usuario_id, accion, tabla, registro_id,
      valor_anterior, valor_nuevo, ip, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await client.execute(query, [
    id,
    usuario_id ?? null,
    accion,
    tabla,
    registro_id,
    valor_anterior ? JSON.stringify(valor_anterior) : null,
    valor_nuevo ? JSON.stringify(valor_nuevo) : null,
    ip ?? null,
    user_agent ?? null
  ]);
}