export type LeadData = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado_id: number;
};

export type LeadFilters = Partial<{
  nombre: string;
  email: string;
  estado_id: number;
}>;