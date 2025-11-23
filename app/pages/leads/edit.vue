<template>
  <div>
    <h1>Editar Lead</h1>
    <form @submit.prevent="updateLeadHandler">
      <div>
        <label for="nombre">Nombre:</label>
        <input id="nombre"  v-model="lead.nombre" >
      </div>
      <div>
        <label for="email">Email:</label>
        <input id="email" v-model="lead.email" >
      </div>
      <div>
        <label for="telefono">Teléfono:</label>
        <input id="telefono" v-model="lead.telefono" >
      </div>
      <div>
        <label for="estado_id">Estado:</label>
        <input id="estado_id"  v-model="lead.estado_id">
      </div>
      <button type="submit">Actualizar</button>
    </form>
  </div>
</template>

<script setup>
import { useLeads } from '~/composables/api/useLeads';

const lead = ref({
  nombre: '',
  email: '',
  telefono: '',
  estado_id: null
});

const { getLeads, updateLead } = useLeads();

const id = ref(''); // Obtener el ID del lead desde la URL o props

onMounted(async () => {
  const leads = await getLeads({ id: id.value });
  if (leads.length > 0) {
    lead.value = leads[0];
  }
});

async function updateLeadHandler() {
  await updateLead(id.value, lead.value);
  alert('Lead actualizado con éxito');
}
</script>