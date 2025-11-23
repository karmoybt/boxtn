-- ======================
-- TABLAS DE ESTADOS (PK INTEGER)
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
-- ROLES Y PERMISOS (PK INTEGER)
-- ======================

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);
INSERT INTO roles (nombre) VALUES ('admin'), ('coach'), ('miembro');

CREATE TABLE permisos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);
INSERT INTO permisos (nombre) VALUES 
('crear_usuario'), ('listar_usuarios'), ('actualizar_usuario'),
('obtener_leads'), ('crear_lead'), ('actualizar_lead'), ('cambiar_estado_lead'),
('crear_clase_recurrente'), ('editar_horario_clase'), ('asignar_coach'),
('crear_instancia'), ('actualizar_instancia'), ('cambiar_estado_instancia'),
('reservar'), ('cancelar_reserva'), ('mover_lista_espera'),
('registrar_asistencia'),
('crear_membresia'), ('actualizar_membresia'), ('eliminar_membresia'),
('comprar_pack'), ('usar_creditos_pack');

CREATE TABLE roles_permisos (
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  permiso_id INTEGER NOT NULL REFERENCES permisos(id),
  PRIMARY KEY (rol_id, permiso_id)
);

-- Asignación robusta sin IDs hardcoded
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'admin';

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN (
  'crear_instancia', 'actualizar_instancia', 'cambiar_estado_instancia'
)
WHERE r.nombre = 'coach';

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.nombre IN (
  'reservar', 'cancelar_reserva', 'mover_lista_espera', 'registrar_asistencia'
)
WHERE r.nombre = 'miembro';

-- ======================
-- ENTIDADES PRINCIPALES (PK TEXT - UUIDs)
-- ======================

CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  idioma TEXT DEFAULT 'es',
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

CREATE TABLE credenciales (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  hash_contrasena TEXT NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

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

CREATE TABLE clases_recurrentes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  dia_semana INTEGER NOT NULL,
  hora_inicio TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  coach_id TEXT REFERENCES usuarios(id),
  capacidad_max INTEGER NOT NULL DEFAULT 12,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);
CREATE INDEX idx_clases_recurrentes_coach ON clases_recurrentes(coach_id);

CREATE TABLE instancias_clase (
  id TEXT PRIMARY KEY,
  clase_recurrente_id TEXT REFERENCES clases_recurrentes(id),
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
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

CREATE TABLE asistencias (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  instancia_clase_id TEXT NOT NULL REFERENCES instancias_clase(id),
  fecha_registro TEXT DEFAULT (datetime('now')),
  UNIQUE(usuario_id, instancia_clase_id)
);
CREATE INDEX idx_asistencias_instancia ON asistencias(instancia_clase_id);

CREATE TABLE membresias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  duracion_dias INTEGER NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE TABLE suscripciones (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  membresia_id TEXT NOT NULL REFERENCES membresias(id),
  estado_id INTEGER NOT NULL REFERENCES estado_suscripcion(id),
  fecha_inicio TEXT NOT NULL,
  fecha_expiracion TEXT NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);
CREATE INDEX idx_suscripciones_usuario ON suscripciones(usuario_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado_id);

CREATE TABLE packs_clases (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creditos INTEGER NOT NULL,
  duracion_dias INTEGER NOT NULL,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT,
  eliminado_en TEXT
);

CREATE TABLE compras_packs (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  pack_id TEXT NOT NULL REFERENCES packs_clases(id),
  creditos_totales INTEGER NOT NULL,
  creditos_usados INTEGER DEFAULT 0,
  fecha_expiracion TEXT NOT NULL,
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
  accion TEXT NOT NULL,
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
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