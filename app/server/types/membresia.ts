export type MembresiaData = {
  id: string;
  nombre: string;
  duracion_dias: number;
};

export type MembresiaFilters = Partial<{
  nombre: string;
}>;