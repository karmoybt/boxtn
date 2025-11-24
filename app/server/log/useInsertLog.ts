import client from '../db/client';

export async function auditLog(
  action: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR',
  data: {
    user_id: string;
    ip_address?: string;
    user_agent?: string;
    table: string;
    record_id: string;
    old_value?: unknown;
    new_value?: unknown;
  }
) {
  await client.execute(
    `INSERT INTO audit_logs (action, user_id, ip_address, user_agent, table_name, record_id, old_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      action,
      data.user_id,
      data.ip_address || null,
      data.user_agent || null,
      data.table,
      data.record_id,
      data.old_value ? JSON.stringify(data.old_value) : null,
      data.new_value ? JSON.stringify(data.new_value) : null
    ]
  );
}