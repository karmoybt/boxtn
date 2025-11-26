export type InstanciaClaseData = {
  id: string;
  clase_recurrente_id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  coach_id: string;
  estado_id: number;
  capacidad_max: number;
};

export type InstanciaClaseFilters = Partial<{
  clase_recurrente_id: string;
  fecha: string;
  coach_id: string;
  estado_id: number;
}>;