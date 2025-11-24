
# Índice de la Estructura del Proyecto

## Carpetas Principales
- **app/**: Carpeta principal de la aplicación.
- **locales/**: Archivos de internacionalización.
  - **en.json**: Archivo de traducciones en inglés.
  - **es.json**: Archivo de traducciones en español.
  - **ca.json**: Archivo de traducciones en catalán.
- **tests/**: Tests unitarios e integración.
  - **unit/**: Tests unitarios.
    - **composables/**: Tests de composables (useLeads, useAuth, etc.).
    - **utils/**: Tests de utilidades como dateUtils.ts o validators.ts.
  - **integration/**: Tests de integración.
    - **server/**: Tests de endpoints API (login, leads, reservas, etc.).
  - **components/**: Tests de componentes.
    - **ui/**: Tests de componentes reutilizables (botones, inputs, etc.).
    - **features/**: Tests de componentes específicos de dominio (ej. LeadForm.vue).
  - **pages/**: Tests de lógica de páginas (acceso condicional, renderizado, etc.).
- **pages/**: Páginas de la aplicación.
  - **index.vue**: Dashboard condicional según rol (admin/coach/miembro).
  - **login.vue**: Formulario de autenticación.
  - **error.vue**: Página de error genérica.
  - **usuarios/**: Gestión CRUD de usuarios (solo admin).
  - **leads/**: Listado, creación y actualización de leads (con estados).
  - **clases/**: Gestión de clases recurrentes.
  - **instancias/**: Visualización y edición de instancias de clase (por fecha/coach).
  - **reservas/**: Gestión de reservas (confirmar, cancelar, lista de espera).
  - **asistencia/**: Registro manual o automático de asistencia.
  - **membresias/**: CRUD de tipos de membresías.
  - **packs/**: CRUD de packs de clases.
- **composables/**: Composables de la aplicación.
  - **api/**: Composables relacionados con la API.
    - **useAuth.ts**: Lógica de login/logout/registro, manejo de tokens, estado de sesión.
    - **useUsuarios.ts**: Operaciones CRUD de usuarios (crear, listar, actualizar).
    - **useClases.ts**: Gestión de clases recurrentes (crear, editar horarios, asignar coach).
    - **useInstancias.ts**: Crear/actualizar instancias, cambiar estado (programada, cancelada, completada).
    - **useReservas.ts**: Reservar, cancelar, mover a lista de espera.
  - **utils/**: Utilidades.
    - **dateUtils.ts**: Formateo de fechas/horas (ej. formatDate, isSameDay).
    - **validators.ts**: Validadores con Zod (ej. leadSchema, loginSchema).
- **server/**: Servidor de la aplicación.
  - **api/**: Endpoints API.
    - **auth/**: Endpoints de autenticación.
      - **login.post.ts**: Autentica y devuelve token/cookie.
      - **logout.post.ts**: Invalida sesión.
      - **register.post.ts**: Crea usuario + credencial.
      - **password-reset.post.ts**: Genera/valida reseteo de contraseña.
    - **usuarios/**: Endpoints de usuarios.
    - **leads/**: Endpoints de leads./Obtener, crear, actualizar leads; transición entre estados (nuevo, inscrito, etc.).
    - **clases/**: Endpoints de clases.
    - **instancias/**: Endpoints de instancias de clase.
    - **reservas/**: Endpoints de reservas.
    - **asistencia/**: Endpoints de asistencia./Registro manual o automático de asistencia.
    - **membresias/**: Endpoints de membresías.CRUD de membresías y suscripciones.
    - **packs/**: Endpoints de packs. Compra y uso de créditos de packs.
  - **db/**: Base de datos.
    - **client.ts**: Cliente de base de datos (ej. better-sqlite3 o drizzle).
    - **migrations/*.sql**: Scripts para aplicar cambios estructurales en DB (versión controlada).
    - **audit.ts**: Función para registrar acciones en logs_auditoria.
  - **middleware/**: Middleware de la aplicación.
    - **auth.ts**: Verifica sesión activa; redirige a /login si no.
    - **role.ts**: Valida permisos por rol (ej. solo admin puede acceder a /usuarios).
  - **plugins/**: Plugins de la aplicación.
    - **db.ts**: Inicializa conexión a DB al arrancar la app.
- **assets/**: Archivos estáticos.
  - **css/main.css**: Estilos globales y variables CSS.
- **layouts/**: Layouts de la aplicación.
  - **default.vue**: Layout con sidebar, header y protección por autenticación.
  - **auth.vue**: Layout minimalista para login/register (sin sidebar).
- **types/**: Interfaces TypeScript.
  - **user.ts**: Interfaz de Usuario.
  - **lead.ts**: Interfaz de Lead.
  - **clase.ts**: Interfaz de Clase.
  - **instancia.ts**: Interfaz de Instancia de Clase.
  - **reserva.ts**: Interfaz de Reserva.
  - **...**: Otras interfaces.

## Archivos de Configuración
- **nuxt.config.ts**: Configuración de Nuxt (i18n, plugins, runtimeConfig, etc.).
- **tsconfig.json**: Configuración de TypeScript.
- **package.json**: Dependencias y scripts.
- **.env**: Variables de entorno (DB path, secretos).
- **.env.example**: Ejemplo de variables de entorno.
- **README.md**: Instrucciones de instalación, scripts y arquitectura.

---

# Generar script SQL con mejoras aplicadas
-- ======================
-- TABLAS DE ESTADOS ESPECÍFICOS 
-- ======================

CREATE TABLE estado_lead (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO estado_lead (id, nombre) VALUES
(1, 'nuevo'),
(2, 'pendiente'),
(3, 'inscrito'),
(4, 'descartado');

CREATE TABLE estado_reserva (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO estado_reserva (id, nombre) VALUES
(10, 'confirmada'),
(11, 'lista_de_espera'),
(12, 'cancelada');

CREATE TABLE estado_instancia_clase (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO estado_instancia_clase (id, nombre) VALUES
(20, 'programada'),
(21, 'cancelada'),
(22, 'completada');

CREATE TABLE estado_suscripcion (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO estado_suscripcion (id, nombre) VALUES
(30, 'activa'),
(31, 'vencida'),
(32, 'pausada');

-- ======================
-- USUARIOS
-- ======================

CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  idioma TEXT DEFAULT 'es',
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'coach', 'miembro')),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

-- Índice para búsquedas por rol
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ======================
-- CREDENCIALES (sin email duplicado)
-- ======================

CREATE TABLE credenciales (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  hash_contrasena TEXT NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

-- ======================
-- LEADS
-- ======================

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  estado_id INTEGER NOT NULL REFERENCES estado_lead(id),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE INDEX idx_leads_estado ON leads(estado_id);

-- ======================
-- CLASES RECURRENTES
-- ======================

CREATE TABLE clases_recurrentes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0 = domingo
  hora_inicio TEXT NOT NULL CHECK (hora_inicio GLOB '??:??'),
  duracion_minutos INTEGER NOT NULL,
  coach_id TEXT REFERENCES usuarios(id),
  capacidad_max INTEGER NOT NULL DEFAULT 12,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE INDEX idx_clases_recurrentes_coach ON clases_recurrentes(coach_id);

-- ======================
-- INSTANCIAS DE CLASE
-- ======================

CREATE TABLE instancias_clase (
  id TEXT PRIMARY KEY,
  clase_recurrente_id TEXT REFERENCES clases_recurrentes(id),
  fecha TEXT NOT NULL CHECK (fecha GLOB '????-??-??'),
  hora_inicio TEXT NOT NULL CHECK (hora_inicio GLOB '??:??'),
  duracion_minutos INTEGER NOT NULL,
  coach_id TEXT REFERENCES usuarios(id),
  estado_id INTEGER NOT NULL REFERENCES estado_instancia_clase(id),
  capacidad_max INTEGER NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT,
  UNIQUE(clase_recurrente_id, fecha)
);

CREATE INDEX idx_instancias_clase_fecha ON instancias_clase(fecha);
CREATE INDEX idx_instancias_clase_estado ON instancias_clase(estado_id);
CREATE INDEX idx_instancias_clase_coach ON instancias_clase(coach_id);

-- ======================
-- RESERVAS
-- ======================

CREATE TABLE reservas (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  instancia_clase_id TEXT NOT NULL REFERENCES instancias_clase(id) ON DELETE CASCADE,
  estado_id INTEGER NOT NULL REFERENCES estado_reserva(id),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT,
  UNIQUE(usuario_id, instancia_clase_id)
);

CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_reservas_instancia ON reservas(instancia_clase_id);
CREATE INDEX idx_reservas_estado ON reservas(estado_id);

-- ======================
-- ASISTENCIAS (sin reservado)
-- ======================

CREATE TABLE asistencias (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  instancia_clase_id TEXT NOT NULL REFERENCES instancias_clase(id),
  fecha_registro TEXT DEFAULT (datetime('now')),
  UNIQUE(usuario_id, instancia_clase_id)
);

CREATE INDEX idx_asistencias_instancia ON asistencias(instancia_clase_id);

-- ======================
-- MEMBRESÍAS
-- ======================

CREATE TABLE membresias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  duracion_dias INTEGER NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

-- ======================
-- SUSCRIPCIONES
-- ======================

CREATE TABLE suscripciones (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  membresia_id TEXT NOT NULL REFERENCES membresias(id),
  estado_id INTEGER NOT NULL REFERENCES estado_suscripcion(id),
  fecha_inicio TEXT NOT NULL CHECK (fecha_inicio GLOB '????-??-??'),
  fecha_expiracion TEXT NOT NULL CHECK (fecha_expiracion GLOB '????-??-??'),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE INDEX idx_suscripciones_usuario ON suscripciones(usuario_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado_id);

-- ======================
-- PACKS DE CLASES
-- ======================

CREATE TABLE packs_clases (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creditos INTEGER NOT NULL,
  duracion_dias INTEGER NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

-- ======================
-- COMPRAS DE PACKS
-- ======================

CREATE TABLE compras_packs (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  pack_id TEXT NOT NULL REFERENCES packs_clases(id),
  creditos_totales INTEGER NOT NULL,
  creditos_usados INTEGER DEFAULT 0 CHECK (creditos_usados &gt;= 0 AND creditos_usados &lt;= creditos_totales),
  fecha_expiracion TEXT NOT NULL CHECK (fecha_expiracion GLOB '????-??-??'),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE INDEX idx_compras_packs_usuario ON compras_packs(usuario_id);

-- ======================
-- AUDITORÍA
-- ======================

CREATE TABLE logs_auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  accion TEXT NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')),
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  valor_anterior TEXT, -- sugerencia: JSON serializado
  valor_nuevo TEXT,    -- sugerencia: JSON serializado
  ip TEXT,
  user_agent TEXT,
  creado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_logs_auditoria_tabla ON logs_auditoria(tabla);
CREATE INDEX idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);

-- ======================
-- MIGRACIONES
-- ======================

CREATE TABLE migraciones (
  version TEXT PRIMARY KEY,
  aplicada_en TEXT DEFAULT (datetime('now'))
);

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
# bun
bun run build
```

Locally preview production build:

```bash
# npm
# bun
bun run preview
```

