-- ======================
-- 1. TABLA UNIFICADA DE ESTADOS
-- ======================

CREATE TABLE estados (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL, -- 'lead', 'reserva', 'instancia_clase', 'suscripcion', 'compra_pack', 'inventario', 'lesion'
    nombre TEXT NOT NULL,
    UNIQUE (categoria, nombre)
);

-- ======================
-- 2. ROLES Y PERMISOS
-- ======================

CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE permisos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE rol_permiso (
    rol_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id TEXT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- ======================
-- 3. USUARIOS Y SEGURIDAD
-- ======================

CREATE TABLE usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    idioma TEXT DEFAULT 'es',
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE TABLE usuario_rol (
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE credenciales (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    hash_contrasena TEXT NOT NULL,
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuario_rol_usuario ON usuario_rol(usuario_id);
CREATE INDEX idx_usuario_rol_rol ON usuario_rol(rol_id);

-- ======================
-- 4. LEADS
-- ======================

CREATE TABLE leads (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    estado_id TEXT NOT NULL REFERENCES estados(id),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT,
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'lead'))
);

CREATE INDEX idx_leads_estado ON leads(estado_id);

-- ======================
-- 5. CLASES Y ENTRENAMIENTOS
-- ======================

CREATE TABLE clases_recurrentes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TEXT NOT NULL CHECK (hora_inicio GLOB '??:??'),
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
    capacidad_max INTEGER NOT NULL DEFAULT 12 CHECK (capacidad_max > 0),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE TABLE instancias_clase (
    id TEXT PRIMARY KEY,
    clase_recurrente_id TEXT REFERENCES clases_recurrentes(id) ON DELETE SET NULL,
    fecha TEXT NOT NULL CHECK (fecha GLOB '????-??-??'),
    hora_inicio TEXT NOT NULL CHECK (hora_inicio GLOB '??:??'),
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
    coach_id TEXT REFERENCES usuarios(id),
    estado_id TEXT NOT NULL REFERENCES estados(id),
    capacidad_max INTEGER NOT NULL CHECK (capacidad_max > 0),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT,
    UNIQUE(clase_recurrente_id, fecha),
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'instancia_clase'))
);

CREATE INDEX idx_instancias_clase_fecha_hora ON instancias_clase(fecha, hora_inicio);
CREATE INDEX idx_instancias_clase_estado ON instancias_clase(estado_id);
CREATE INDEX idx_instancias_clase_coach ON instancias_clase(coach_id);

CREATE TABLE nivel_clase (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE clase_nivel (
    clase_recurrente_id TEXT NOT NULL REFERENCES clases_recurrentes(id) ON DELETE CASCADE,
    nivel_id TEXT NOT NULL REFERENCES nivel_clase(id) ON DELETE CASCADE,
    PRIMARY KEY (clase_recurrente_id, nivel_id)
);

-- ======================
-- 6. RESERVAS Y ASISTENCIAS
-- ======================

CREATE TABLE reservas (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    instancia_clase_id TEXT NOT NULL REFERENCES instancias_clase(id) ON DELETE CASCADE,
    estado_id TEXT NOT NULL REFERENCES estados(id),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT,
    UNIQUE(usuario_id, instancia_clase_id),
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'reserva'))
);

CREATE TABLE asistencias (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    instancia_clase_id TEXT NOT NULL REFERENCES instancias_clase(id),
    reserva_id TEXT REFERENCES reservas(id) ON DELETE SET NULL, -- vinculación explícita
    fecha_registro TEXT DEFAULT (datetime('now')),
    UNIQUE(usuario_id, instancia_clase_id)
);

CREATE INDEX idx_reservas_instancia_estado ON reservas(instancia_clase_id, estado_id);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_asistencias_instancia ON asistencias(instancia_clase_id);
CREATE INDEX idx_asistencias_reserva ON asistencias(reserva_id);

-- ======================
-- 7. MEMBRESÍAS Y PACKS
-- ======================

CREATE TABLE membresias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE TABLE suscripciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    membresia_id TEXT NOT NULL REFERENCES membresias(id),
    estado_id TEXT NOT NULL REFERENCES estados(id),
    fecha_inicio TEXT NOT NULL CHECK (fecha_inicio GLOB '????-??-??'),
    fecha_expiracion TEXT NOT NULL CHECK (fecha_expiracion GLOB '????-??-??'),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT,
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'suscripcion'))
);

CREATE TABLE packs_clases (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    creditos INTEGER NOT NULL CHECK (creditos > 0),
    duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE TABLE compras_packs (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    pack_id TEXT NOT NULL REFERENCES packs_clases(id),
    estado_id TEXT NOT NULL REFERENCES estados(id),
    creditos_totales INTEGER NOT NULL CHECK (creditos_totales > 0),
    creditos_usados INTEGER DEFAULT 0 CHECK (creditos_usados >= 0 AND creditos_usados <= creditos_totales),
    fecha_expiracion TEXT NOT NULL CHECK (fecha_expiracion GLOB '????-??-??'),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT,
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'compra_pack'))
);

-- Índices para validar membresías/packs activos y no expirados
CREATE INDEX idx_suscripciones_activas ON suscripciones(usuario_id, estado_id, fecha_expiracion)
    WHERE estado_id = (SELECT id FROM estados WHERE categoria = 'suscripcion' AND nombre = 'activa');
CREATE INDEX idx_compras_packs_usables ON compras_packs(usuario_id, estado_id, fecha_expiracion)
    WHERE estado_id IN (
        SELECT id FROM estados WHERE categoria = 'compra_pack' AND nombre IN ('activa', 'parcial')
    );

-- ======================
-- 8. WODS Y RENDIMIENTO
-- ======================

CREATE TABLE wods (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha_programada TEXT CHECK (fecha_programada GLOB '????-??-??'),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    eliminado_en TEXT
);

CREATE TABLE movimientos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    tipo TEXT, -- 'peso', 'repeticiones', 'tiempo'
    descripcion TEXT
);

CREATE TABLE wod_movimiento (
    wod_id TEXT NOT NULL REFERENCES wods(id) ON DELETE CASCADE,
    movimiento_id TEXT NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    PRIMARY KEY (wod_id, movimiento_id)
);

CREATE TABLE registros_wod (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    wod_id TEXT NOT NULL REFERENCES wods(id),
    movimiento_id TEXT NOT NULL REFERENCES movimientos(id),
    valor NUMERIC NOT NULL,
    unidad TEXT,
    fecha_realizacion TEXT DEFAULT (date('now')),
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_registros_wod_usuario_fecha ON registros_wod(usuario_id, fecha_realizacion);

CREATE TABLE maximos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    movimiento_id TEXT NOT NULL REFERENCES movimientos(id),
    valor NUMERIC NOT NULL,
    fecha_logro TEXT DEFAULT (date('now')),
    tipo TEXT NOT NULL,
    UNIQUE(usuario_id, movimiento_id, tipo)
);

-- ✂️ Tabla `estadisticas` eliminada: usar vistas o calcular en app

-- Metas
CREATE TABLE metas (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    descripcion TEXT NOT NULL,
    valor_objetivo NUMERIC NOT NULL,
    valor_actual NUMERIC DEFAULT 0,
    completada BOOLEAN DEFAULT 0,
    fecha_inicio TEXT,
    fecha_limite TEXT,
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT
);

-- ======================
-- 9. SEGUIMIENTO AVANZADO
-- ======================

CREATE TABLE asignaciones_coach (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL REFERENCES usuarios(id),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TEXT NOT NULL CHECK (hora_inicio GLOB '??:??'),
    hora_fin TEXT NOT NULL CHECK (hora_fin GLOB '??:??'),
    creado_en TEXT DEFAULT (datetime('now')),
    eliminado_en TEXT
);

CREATE TABLE evaluaciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    movimiento_id TEXT NOT NULL REFERENCES movimientos(id),
    nivel TEXT NOT NULL,
    comentarios TEXT,
    evaluado_por TEXT NOT NULL REFERENCES usuarios(id),
    fecha_evaluacion TEXT DEFAULT (date('now')),
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notas_usuario (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    tipo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    registrado_por TEXT NOT NULL REFERENCES usuarios(id),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT
);

CREATE TABLE cargas_entrenamiento (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    fecha TEXT NOT NULL CHECK (fecha GLOB '????-??-??'),
    volumen REAL NOT NULL,
    intensidad REAL NOT NULL,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE lesiones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    descripcion TEXT NOT NULL,
    estado_id TEXT NOT NULL REFERENCES estados(id),
    fecha_inicio TEXT NOT NULL CHECK (fecha_inicio GLOB '????-??-??'),
    fecha_recuperacion TEXT CHECK (fecha_recuperacion GLOB '????-??-??'),
    registrado_por TEXT NOT NULL REFERENCES usuarios(id),
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'lesion'))
);

CREATE TABLE body_composition (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    fecha TEXT NOT NULL CHECK (fecha GLOB '????-??-??'),
    peso REAL,
    grasa_corporal REAL,
    masa_muscular REAL,
    observaciones TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE comentarios_coach (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    coach_id TEXT NOT NULL REFERENCES usuarios(id),
    contenido TEXT NOT NULL,
    fecha TEXT DEFAULT (date('now')),
    creado_en TEXT DEFAULT (datetime('now'))
);

-- ======================
-- 10. GESTIÓN INTERNA
-- ======================

CREATE TABLE inventario (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT,
    cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
    estado_id TEXT NOT NULL REFERENCES estados(id),
    ubicacion TEXT,
    creado_en TEXT DEFAULT (datetime('now')),
    actualizado_en TEXT,
    CHECK (estado_id IN (SELECT id FROM estados WHERE categoria = 'inventario'))
);

CREATE TABLE mantenimiento (
    id TEXT PRIMARY KEY,
    inventario_id TEXT NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    fecha_mantenimiento TEXT NOT NULL CHECK (fecha_mantenimiento GLOB '????-??-??'),
    responsable_id TEXT NOT NULL REFERENCES usuarios(id),
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE encuestas (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL,
    activa BOOLEAN DEFAULT 1,
    creado_en TEXT DEFAULT (datetime('now')),
    cerrada_en TEXT
);

CREATE TABLE respuestas_encuesta (
    id TEXT PRIMARY KEY,
    encuesta_id TEXT NOT NULL REFERENCES encuestas(id) ON DELETE CASCADE,
    usuario_id TEXT REFERENCES usuarios(id),
    respuesta TEXT NOT NULL,
    fecha_respuesta TEXT DEFAULT (datetime('now'))
);

-- ======================
-- 11. NOTIFICACIONES
-- ======================

CREATE TABLE notificaciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    cuerpo TEXT NOT NULL,
    leida BOOLEAN DEFAULT 0,
    fecha_envio TEXT DEFAULT (datetime('now')),
    relacion_id TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE preferencias_notif (
    usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    recordatorios BOOLEAN DEFAULT 1,
    anuncios BOOLEAN DEFAULT 1,
    cambios_clase BOOLEAN DEFAULT 1,
    actualizado_en TEXT DEFAULT (datetime('now'))
);

-- ======================
-- 12. AUDITORÍA
-- ======================

CREATE TABLE logs_auditoria (
    id TEXT PRIMARY KEY,
    usuario_id TEXT,
    accion TEXT NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')),
    tabla TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    valor_anterior TEXT, -- JSON
    valor_nuevo TEXT, -- JSON
    ip TEXT,
    user_agent TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_logs_auditoria_tabla ON logs_auditoria(tabla);
CREATE INDEX idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);

-- ======================
-- 13. MIGRACIONES
-- ======================

CREATE TABLE migraciones (
    version TEXT PRIMARY KEY,
    aplicada_en TEXT DEFAULT (datetime('now'))
);

-- ======================
-- 14. DATOS INICIALES
-- ======================

-- Roles
INSERT INTO roles (id, nombre) VALUES
('rol_admin', 'admin'),
('rol_coach', 'coach'),
('rol_miembro', 'miembro');

-- Permisos
INSERT INTO permisos (id, nombre, descripcion) VALUES
('perm_lead_crear', 'lead:crear', 'Crear leads'),
('perm_lead_ver', 'lead:ver', 'Ver leads'),
('perm_clase_gestion', 'clase:gestion', 'Gestionar clases'),
('perm_reserva_self', 'reserva:self', 'Reservar para sí mismo'),
('perm_usuario_admin', 'usuario:admin', 'Administrar usuarios');

-- Asignaciones rol-permiso
INSERT INTO rol_permiso (rol_id, permiso_id) VALUES
('rol_admin', 'perm_lead_crear'),
('rol_admin', 'perm_lead_ver'),
('rol_admin', 'perm_clase_gestion'),
('rol_admin', 'perm_reserva_self'),
('rol_admin', 'perm_usuario_admin'),
('rol_coach', 'perm_lead_crear'),
('rol_coach', 'perm_lead_ver'),
('rol_coach', 'perm_clase_gestion'),
('rol_coach', 'perm_reserva_self'),
('rol_miembro', 'perm_lead_ver'),
('rol_miembro', 'perm_reserva_self');

-- Estados (usando la tabla unificada)
INSERT INTO estados (id, categoria, nombre) VALUES
-- Leads
('lead_nuevo', 'lead', 'nuevo'),
('lead_pendiente', 'lead', 'pendiente'),
('lead_inscrito', 'lead', 'inscrito'),
('lead_descartado', 'lead', 'descartado'),
-- Reservas
('reserva_confirmada', 'reserva', 'confirmada'),
('reserva_lista_espera', 'reserva', 'lista_de_espera'),
('reserva_cancelada', 'reserva', 'cancelada'),
-- Instancias de clase
('clase_programada', 'instancia_clase', 'programada'),
('clase_cancelada', 'instancia_clase', 'cancelada'),
('clase_completada', 'instancia_clase', 'completada'),
-- Suscripciones
('suscripcion_activa', 'suscripcion', 'activa'),
('suscripcion_vencida', 'suscripcion', 'vencida'),
('suscripcion_pausada', 'suscripcion', 'pausada'),
-- Packs
('pack_activa', 'compra_pack', 'activa'),
('pack_vencida', 'compra_pack', 'vencida'),
('pack_agotada', 'compra_pack', 'agotada'),
-- Inventario
('inv_disponible', 'inventario', 'disponible'),
('inv_mantenimiento', 'inventario', 'en_mantenimiento'),
('inv_baja', 'inventario', 'baja'),
-- Lesiones
('lesion_activa', 'lesion', 'activa'),
('lesion_recuperacion', 'lesion', 'en_recuperacion'),
('lesion_recuperada', 'lesion', 'recuperada');