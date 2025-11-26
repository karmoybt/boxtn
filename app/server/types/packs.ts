export type PackData = {
  id: string;
  nombre: string;
  creditos: number;
  duracion_dias: number;
};

export type PackFilters = Partial<{
  nombre: string;
}>;