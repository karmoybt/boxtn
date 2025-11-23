import db from '~/server/db/client';
import { z } from 'zod';

const leadSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  estado_id: z.number().optional()
});

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ status: 400, message: 'ID is required' });
  }

  const body = await readBody(event);
  const { nombre, email, telefono, estado_id } = leadSchema.partial().parse(body);

  const updates = [];
  const args = [];

  if (nombre) {
    updates.push('nombre = ?');
    args.push(nombre);
  }
  if (email) {
    updates.push('email = ?');
    args.push(email);
  }
  if (telefono) {
    updates.push('telefono = ?');
    args.push(telefono);
  }
  if (estado_id) {
    updates.push('estado_id = ?');
    args.push(estado_id);
  }

  if (updates.length === 0) {
    throw createError({ status: 400, message: 'No updates provided' });
  }

  args.push(id);

  await db.execute({
    sql: `
      UPDATE leads
      SET ${updates.join(', ')}
      WHERE id = ?
    `,
    args
  });

  return { ok: true };
});