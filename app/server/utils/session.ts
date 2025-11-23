import { setCookie } from 'h3';
import type { H3Event } from 'h3';
import jwt from 'jsonwebtoken';

export async function setUserSession(event: H3Event, { userId, role }: { userId: string; role: string }) {
  const token = generateJwt({ userId, role });

  setCookie(event, 'session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 días
  });

  return { userId, role, token };
}

function generateJwt(payload: { userId: string; role: string }) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}