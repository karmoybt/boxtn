import db from '~/server/db/client';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ status: 400, message: 'ID is required' });
  }

  await db.execute({
    sql: `
      DELETE FROM leads
      WHERE id = ?
    `,
    args: [id]
  });

  return { ok: true };
});