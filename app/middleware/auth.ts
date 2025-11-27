import { verifyToken } from '../utils/jwt' // tú implementas esto

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return // sin autenticación, se maneja en la API
  }

  const token = authHeader.substring(7)
  try {
    const payload = await verifyToken(token)
    event.context.auth = { userId: payload.sub }
  } catch (err) {
    // token inválido → se tratará como no autenticado
  }
})