import { nanoid } from 'nanoid';
import db from '~/server/db/client';
import { z } from 'zod';

const leadSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email().optional(),
  telefono: z.string().optional()
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { nombre, email, telefono } = leadSchema.parse(body);

  await db.execute({
    sql: `
      INSERT INTO leads (id, nombre, email, telefono, estado_id)
      VALUES (?, ?, ?, ?, 1)
    `,
    args: [nanoid(), nombre, email || null, telefono || null]
  });

  return { ok: true };
});