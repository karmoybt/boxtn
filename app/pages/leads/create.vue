<template>
  <div>
    <h1>Crear Lead</h1>
    <form @submit.prevent="createLeadHandler">
      <div>
        <label for="id">ID:</label>
        <input id="id" v-model="lead.id"  required >
      </div>
      <div>
        <label for="nombre">Nombre:</label>
        <input id="nombre"  v-model="lead.nombre" required >
      </div>
      <div>
        <label for="email">Email:</label>
        <input id="email" v-model="lead.email"  >
      </div>
      <div>
        <label for="telefono">Teléfono:</label>
        <input id="telefono" v-model="lead.telefono"  >
      </div>
      <div>
        <label for="estado_id">Estado:</label>
        <input id="estado_id" v-model="lead.estado_id"  required >
      </div>
      <button type="submit">Crear</button>
    </form>
  </div>
</template>

<script setup>
import { useLeads } from '~/composables/api/useLeads';

const lead = ref({
  id: '',
  nombre: '',
  email: '',
  telefono: '',
  estado_id: 1
});

const { createLead } = useLeads();

async function createLeadHandler() {
  await createLead(lead.value);
  alert('Lead creado con éxito');
}
</script>