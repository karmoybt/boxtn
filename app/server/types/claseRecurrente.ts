export type ClaseRecurrenteData = {
  id: string;
  nombre: string;
  dia_semana: number;
  hora_inicio: string;
  duracion_minutos: number;
  coach_id: string | null;
  capacidad_max: number;
};

export type ClaseRecurrenteFilters = Partial<{
  nombre: string;
  dia_semana: number;
  coach_id: string;
}>;