// plugins/db.ts
import db from '~/server/db/client';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      db
    }
  };
});