import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import { nanoid } from 'nanoid';
import client from '~/server/db/client';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function useAuth() {
  const sessionCookie = useCookie('session');

  async function login(email: string, password: string) {
    try {
      const { email: loginEmail, password: loginPassword } = loginSchema.parse({ email, password });

      // Consulta la base de datos para verificar las credenciales
      const query = `
        SELECT u.id, u.rol, c.hash_contrasena
        FROM usuarios u
        JOIN credenciales c ON u.id = c.usuario_id
        WHERE u.email = ?
      `;
      const params = [loginEmail];

      const result = await client.execute(query, params);

      if (!result.rows.length) {
        return { ok: false, error: 'Credenciales inválidas' };
      }

      const user = result.rows[0];
      if (!user) {
        return { ok: false, error: 'Credenciales inválidas' };
      }

      if (typeof user.hash_contrasena !== 'string') {
          return { ok: false, error: 'Credenciales inválidas' };
      }
      const isPasswordValid = user.hash_contrasena ? await compare(loginPassword, user.hash_contrasena) : false;

      if (!isPasswordValid) {
        return { ok: false, error: 'Credenciales inválidas' };
      }

      // Verifica que JWT_SECRET no sea undefined
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in the environment variables');
      }

      // Convierte user.id a un string antes de pasarlo a jwt.sign
      const token = jwt.sign({ userId: String(user.id), role: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
      sessionCookie.value = token;

      return { ok: true, user: { userId: String(user.id), role: user.rol } };
    } catch (error) {
      console.error('Error during login:', error);
      return { ok: false, error: 'Login failed' };
    }
  }

  async function logout() {
    sessionCookie.value = null;
    return { ok: true };
  }

  async function register(userData: { email: string; password: string; nombre: string }) {
    try {
      const { email, password, nombre } = registerSchema.parse(userData);

      const userId = nanoid();
      const hashedPassword = await hash(password, 10);

      await client.execute({
        sql: `
          INSERT INTO usuarios (id, email, nombre, rol)
          VALUES (?, ?, ?, 'miembro')
        `,
        args: [userId, email, nombre]
      });

      await client.execute({
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

  async function useUserSession() {
    if (!sessionCookie.value) {
      return { user: null };
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    try {
      const decodedUser = jwt.verify(sessionCookie.value, process.env.JWT_SECRET) as { userId: string; role: string };
      if (!decodedUser) {
        return { user: null };
      }
      return { user: decodedUser };
    } catch (error) {
      console.error('Error verifying session:', error);
      return { user: null };
    }
  }

  return { login, logout, register, useUserSession };
}