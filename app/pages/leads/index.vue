<template>
  <div>
    <h1>Leads</h1>
    <div>
      <input v-model="filters.nombre" placeholder="Nombre" >
      <input v-model="filters.email" placeholder="Email" >
      <button @click="fetchLeads">Buscar</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lead in leads" :key="lead.id">
          <td>{{ lead.id }}</td>
          <td>{{ lead.nombre }}</td>
          <td>{{ lead.email }}</td>
          <td>{{ lead.telefono }}</td>
          <td>{{ lead.estado_id }}</td>
          <td>
            <button @click="editLead(lead.id)">Editar</button>
            <button @click="deleteLeadHandler(lead.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLeads } from '~/composables/api/useLeads';

const filters = ref({});
const leads = ref([]);

const { getLeads, deleteLead } = useLeads();

async function fetchLeads() {
  leads.value = await getLeads(filters.value);
}

async function deleteLeadHandler(id) {
  await deleteLead(id);
  fetchLeads();
}
</script>