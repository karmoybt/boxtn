-- sqlite3 genTurso.sqlite < scripts/init-genTurso.sql
--npx tsx scripts/codegen.ts

-- scripts/init-genTurso.sql
CREATE TABLE IF NOT EXISTS codegen_excluded_tables (
  table_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS codegen_timestamp_fields (
  field_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS codegen_entity_permissions (
  table_name TEXT PRIMARY KEY,
  read_perm  TEXT NOT NULL,
  write_perm TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS codegen_audit_entities (
  table_name TEXT PRIMARY KEY
);

-- Valores iniciales (AJUSTA SEGÚN TUS ENTIDADES)
INSERT OR IGNORE INTO codegen_excluded_tables (table_name) VALUES
  ('usuario_rol'),
  ('rol_permiso'),
  ('clase_nivel'),
  ('wod_movimiento'),
  ('migraciones'),
  ('logs_auditoria'),
  ('estados'),
  ('roles'),
  ('permisos'),
  ('nivel_clase'),
  ('movimientos'),
  ('encuestas'),
  ('respuestas_encuesta');

INSERT OR IGNORE INTO codegen_timestamp_fields (field_name) VALUES
  ('creado_en'), ('actualizado_en'), ('eliminado_en'), ('fecha'), ('fecha_inicio'),
  ('fecha_expiracion'), ('fecha_recuperacion'), ('fecha_realizacion'),
  ('fecha_evaluacion'), ('fecha_envio'), ('fecha_mantenimiento'),
  ('fecha_logro'), ('fecha_limite'), ('cerrada_en'), ('aplicada_en');

-- ⚠️ AJUSTA ESTAS LÍNEAS A TUS ENTIDADES REALES
INSERT OR IGNORE INTO codegen_entity_permissions (table_name, read_perm, write_perm) VALUES
  ('usuarios', 'usuario:read', 'usuario:write'),
  ('leads', 'lead:read', 'lead:write'),
  ('clases', 'clase:read', 'clase:write'),
  ('wods', 'wod:read', 'wod:write');

-- ⚠️ ACTIVA AUDITORÍA SOLO DONDE QUIERAS
INSERT OR IGNORE INTO codegen_audit_entities (table_name) VALUES
  ('leads'),
  ('usuarios');