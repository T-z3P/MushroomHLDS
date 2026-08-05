<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <header class="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">MushroomHLDS</h1>
          <p class="text-sm text-slate-400">GoldSrc Server Suite & Host Controller</p>
        </div>
        <button @click="showModal = true" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-2xl transition shadow-lg shadow-indigo-600/20">
          + Add HLDS Instance
        </button>
      </header>

      <!-- Host Machine Stats -->
      <HostStatCard :stats="hostStats" />

      <!-- Active Servers -->
      <section>
        <h2 class="text-lg font-semibold mb-3 text-slate-300">Active Game Servers</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ServerMushroomCard 
            v-for="server in servers" 
            :key="server.id" 
            :server="server" 
            @toggle="handlePower" 
            @open-rcon="activeRconServer = server" 
          />
        </div>
      </section>

      <!-- Platform Audit Trail -->
      <ActionLogs :logs="auditLogs" />

      <!-- Interactive RCON Console -->
      <RconConsole v-if="activeRconServer" :server="activeRconServer" @close="activeRconServer = null" />

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import HostStatCard from './components/HostStatCard.vue';
import ServerMushroomCard from './components/ServerMushroomCard.vue';
import ActionLogs from './components/ActionLogs.vue';
import RconConsole from './components/RconConsole.vue';

const hostStats = ref({});
const servers = ref([]);
const auditLogs = ref([]);
const activeRconServer = ref(null);
const showModal = ref(false);

async function fetchData() {
  const [resStats, resServers, resLogs] = await Promise.all([
    fetch('/api/host/stats').then(r => r.json()),
    fetch('/api/servers').then(r => r.json()),
    fetch('/api/audit-logs').then(r => r.json())
  ]);
  hostStats.value = resStats;
  servers.value = resServers;
  auditLogs.value = resLogs;
}

async function handlePower({ id, action }) {
  await fetch(`/api/servers/${id}/power`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  fetchData();
}

onMounted(() => {
  fetchData();
  setInterval(fetchData, 5000);
});
</script>