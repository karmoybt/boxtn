-- genTurso.sqlite
CREATE TABLE IF NOT EXISTS codegen_excluded_tables (
  table_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS codegen_timestamp_fields (
  field_name TEXT PRIMARY KEY
);

-- Insertar valores iniciales
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