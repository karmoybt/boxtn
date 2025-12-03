import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const root = process.cwd();

const files: Record<string, string> = {
  "server/api/auth/[...betterAuth].ts": `
import { betterAuth } from "better-auth";
import { sqliteAdapter } from "@better-auth/sqlite";

export default betterAuth({
  database: sqliteAdapter({
    db: {
      dialect: "sqlite",
      storage: "./database.sqlite",
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    sendVerificationEmail: false,
  },
  session: {
    maxAge: 24 * 60 * 60,
    updateAge: true,
  },
  rateLimit: {
    window: 10 * 60 * 1000,
    max: 5,
  },
  email: {
    sendVerificationCode: () => Promise.resolve(),
    sendPasswordReset: () => Promise.resolve(),
  },
});
`.trim(),

  "app/plugins/betterauth.ts": `
import { createAuthClient } from "better-auth/client";

export default defineNuxtPlugin(() => {
  const client = createAuthClient({
    baseURL: "/api/auth",
  });

  return {
    provide: {
      auth: client,
    },
  };
});
`.trim(),

  "app/composables/useAuthRedirect.ts": `
export const useAuthRedirect = () => {
  const route = useRoute();
  const router = useRouter();

  const afterLoginTo = () => {
    const redirect = route.query.redirect?.toString() || "/dashboard";
    return router.push(redirect);
  };

  const redirectToLogin = () => {
    const redirect = encodeURIComponent(route.path);
    return router.push(\`/auth?redirect=\${redirect}\`);
  };

  return { afterLoginTo, redirectToLogin };
};
`.trim(),

  "app/composables/useInactivityLogout.ts": `
export function useInactivityLogout(timeoutMinutes = 15) {
  if (process.server) return;

  const timeoutMs = timeoutMinutes * 60 * 1000;
  let timer: NodeJS.Timeout | null = null;

  const logout = async () => {
    try {
      await $fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      navigateTo("/auth");
    }
  };

  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(logout, timeoutMs);
  };

  const start = () => {
    resetTimer();
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, true));
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((ev) => window.removeEventListener(ev, resetTimer, true));
  };

  onMounted(() => start());
  onBeforeUnmount(() => stop());
}
`.trim(),

  "app/pages/index.vue": `
<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold">Bienvenido</h1>
    <p class="mt-2">App segura con Nuxt + Better Auth</p>
    <NuxtLink
      to="/auth"
      class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Iniciar sesión
    </NuxtLink>
  </div>
</template>
`.trim(),

  "app/pages/auth.vue": `
<template>
  <div class="max-w-md mx-auto p-6 space-y-6">
    <div v-if="mode === 'login'">
      <h2 class="text-2xl font-bold">Iniciar sesión</h2>
      <form @submit.prevent="handleLogin" class="space-y-4 mt-4">
        <input
          v-model="login.email"
          type="email"
          placeholder="Email"
          class="w-full p-2 border rounded"
          required
        />
        <input
          v-model="login.password"
          type="password"
          placeholder="Contraseña"
          class="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? "Iniciando..." : "Entrar" }}
        </button>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      </form>
      <p class="mt-4">
        ¿No tienes cuenta?
        <button
          @click="mode = 'register'"
          class="text-blue-600 underline hover:text-blue-800"
        >
          Regístrate
        </button>
      </p>
    </div>

    <div v-else>
      <h2 class="text-2xl font-bold">Crear cuenta</h2>
      <form @submit.prevent="handleRegister" class="space-y-4 mt-4">
        <input
          v-model="register.email"
          type="email"
          placeholder="Email"
          class="w-full p-2 border rounded"
          required
        />
        <input
          v-model="register.password"
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          class="w-full p-2 border rounded"
          required
          minlength="6"
        />
        <button
          type="submit"
          class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? "Registrando..." : "Registrarse" }}
        </button>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      </form>
      <p class="mt-4">
        ¿Ya tienes cuenta?
        <button
          @click="mode = 'login'"
          class="text-blue-600 underline hover:text-blue-800"
        >
          Iniciar sesión
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const mode = ref<"login" | "register">("login");
const login = reactive({ email: "", password: "" });
const register = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");

const { afterLoginTo } = useAuthRedirect();
const { signIn, signUp } = useAuth();

const handleError = (err: any) => {
  error.value = err?.data?.message || "Error desconocido. Inténtalo de nuevo.";
  loading.value = false;
};

const handleLogin = async () => {
  loading.value = true;
  error.value = "";
  try {
    await signIn("email", { email: login.email, password: login.password });
    await afterLoginTo();
  } catch (err) {
    handleError(err);
  }
};

const handleRegister = async () => {
  loading.value = true;
  error.value = "";
  try {
    await signUp("email", { email: register.email, password: register.password });
    await afterLoginTo();
  } catch (err) {
    handleError(err);
  }
};
</script>
`.trim(),

  "app/pages/dashboard.vue": `
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold">Panel de Control</h1>
    <p class="mt-2">Bienvenido, <strong>{{ user?.email }}</strong>!</p>
    <button
      @click="handleLogout"
      class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Cerrar sesión
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { data: session } = await useFetch("/api/auth/me");
const user = session.value?.user;

if (!user) {
  await navigateTo("/auth");
}

useInactivityLogout(15);

const handleLogout = async () => {
  const { signOut } = useAuth();
  await signOut();
  await navigateTo("/auth");
};
</script>
`.trim(),

  "app/middleware/auth.ts": `
export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = await useFetch("/api/auth/me");
  if (!data.value?.user) {
    return navigateTo(\`/auth?redirect=\${encodeURIComponent(to.fullPath)}\`);
  }
});
`.trim(),
};

async function main() {
  for (const [filepath, content] of Object.entries(files)) {
    const fullPath = join(root, filepath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, "utf8");
    console.log(`✅ Creado: ${filepath}`);
  }
}

main().catch(console.error);
