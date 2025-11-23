<template>
  <div>
    <h1>Detalle del Lead</h1>
    <div>
      <p><strong>ID:</strong> {{ lead.id }}</p>
      <p><strong>Nombre:</strong> {{ lead.nombre }}</p>
      <p><strong>Email:</strong> {{ lead.email }}</p>
      <p><strong>Teléfono:</strong> {{ lead.telefono }}</p>
      <p><strong>Estado:</strong> {{ lead.estado_id }}</p>
    </div>
    <button @click="editLead">Editar</button>
    <button @click="deleteLead">Eliminar</button>
  </div>
</template>

<script setup>
import { useLeads } from '~/composables/api/useLeads';

const lead = ref({
  id: '',
  nombre: '',
  email: '',
  telefono: '',
  estado_id: null
});

const { getLeads, deleteLead } = useLeads();

const id = ref(''); // Obtener el ID del lead desde la URL o props

onMounted(async () => {
  const leads = await getLeads({ id: id.value });
  if (leads.length > 0) {
    lead.value = leads[0];
  }
});

async function editLead() {
  // Redirigir a la página de edición
}

async function deleteLead() {
  await deleteLead(id.value);
  alert('Lead eliminado con éxito');
}
</script>