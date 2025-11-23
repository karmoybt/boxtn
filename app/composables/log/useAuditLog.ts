// server/utils/auditLogger.ts
import { randomUUID } from 'node:crypto';
import { writeAuditLog } from './useInsertLog'; // Asegúrate de que esta función exista

let currentTraceId: string | null = null;

export const setTraceId = (id: string) => {
  currentTraceId = id;
};

export interface AuditLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  trace_id: string;
  user_id?: string;
  ip_address?: string;
  [key: string]: unknown;
}

// ✅ Función asíncrona para auditoría persistente
export const auditLog = async (
  event: string,
  {
    user_id,
    ip_address,
    table,
    record_id,
    old_value,
    new_value,
    user_agent,
    ...rest
  }: Partial<AuditLog> & {
    table: string;
    record_id: string;
    old_value?: unknown;
    new_value?: unknown;
    user_agent?: string;
  }
): Promise<{ trace_id: string }> => {
  const trace_id = currentTraceId || randomUUID();

  // Guardar en la tabla de auditoría
  await writeAuditLog({
    usuario_id: user_id,
    accion: event,
    tabla: table,
    registro_id: record_id,
    valor_anterior: old_value ? JSON.stringify(old_value) : undefined,
    valor_nuevo: new_value ? JSON.stringify(new_value) : undefined,
    ip: ip_address,
    user_agent,
  });

  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        event,
        trace_id,
        user_id,
        ip_address,
        table,
        record_id,
        ...rest,
      }, null, 2)
    );
  }

  return { trace_id };
};