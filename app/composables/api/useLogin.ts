import { compare } from 'bcrypt';
import db from '~/server/db/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function loginUser(data: { email: string; password: string }) {
  try {
    const { email, password } = loginSchema.parse(data);

    const user = await db.execute({
      sql: `
        SELECT u.id, u.rol, c.hash_contrasena
        FROM usuarios u
        JOIN credenciales c ON c.usuario_id = u.id
        WHERE u.email = ? AND u.eliminado_en IS NULL
      `,
      args: [email]
    });

    if (user.rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const row = user.rows[0];
    if (!row) {
      throw new Error('Credenciales inválidas');
    }

    const isValid = await compare(password, row.hash_contrasena as string);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    return {
      userId: row.id as string,
      role: row.rol as string
    };
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}