export type AsistenciaData = {
  id: string;
  usuario_id: string;
  instancia_clase_id: string;
};

export type AsistenciaFilters = Partial<{
  usuario_id: string;
  instancia_clase_id: string;
}>;