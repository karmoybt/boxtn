import { hash } from 'bcrypt';
import { nanoid } from 'nanoid';
import db from '~/server/db/client';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2)
});

export async function registerUser(data: { email: string; password: string; nombre: string }) {
  try {
    const { email, password, nombre } = registerSchema.parse(data);

    const userId = nanoid();
    const hashedPassword = await hash(password, 10);

    await db.execute({
      sql: `
        INSERT INTO usuarios (id, email, nombre, rol)
        VALUES (?, ?, ?, 'miembro')
      `,
      args: [userId, email, nombre]
    });

    await db.execute({
      sql: `
        INSERT INTO credenciales (id, usuario_id, hash_contrasena)
        VALUES (?, ?, ?)
      `,
      args: [nanoid(), userId, hashedPassword]
    });

    return { ok: true };
  } catch (error) {
    console.error('Error during registration:', error);
    return { ok: false, error: 'Registration failed' };
  }
}