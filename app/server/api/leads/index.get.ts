import db from '~/server/db/client';
import { z } from 'zod';

const leadSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  estado_id: z.number()
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { nombre, email, telefono, estado_id } = leadSchema.partial().parse(query);

  const whereClause = [];
  const args = [];

  if (nombre) {
    whereClause.push('nombre LIKE ?');
    args.push(`%${nombre}%`);
  }
  if (email) {
    whereClause.push('email = ?');
    args.push(email);
  }
  if (telefono) {
    whereClause.push('telefono = ?');
    args.push(telefono);
  }
  if (estado_id) {
    whereClause.push('estado_id = ?');
    args.push(estado_id);
  }

  const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

  const leads = await db.execute({
    sql: `
      SELECT * FROM leads
      ${where}
    `,
    args
  });

  return leads.rows;
});