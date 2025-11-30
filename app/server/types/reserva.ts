export type ReservaData = {
  id: string
  usuario_id: string
  instancia_clase_id: string
  estado_id: number
}

export type ReservaFilters = {
  usuario_id?: string     
  instancia_clase_id?: string
  estado_id?: number
}

export type ReservaCreateData = {
  id: string;
  instancia_clase_id: string;
};

export type ReservaUpdateData = {
  estado_id: number;
};


