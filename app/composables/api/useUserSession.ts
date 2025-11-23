import jwt from 'jsonwebtoken';

export async function useUserSession() {
  const sessionCookie = useCookie('session');

  if (!sessionCookie.value) {
    return { user: null };
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  try {
    const decodedUser = jwt.verify(sessionCookie.value, process.env.JWT_SECRET) as { userId: string; role: string };
    return { user: decodedUser };
  } catch (error) {
    console.error('Error verifying session:', error);
    return { user: null };
  }
}