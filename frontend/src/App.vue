<template>
  <div class="max-w-7xl mx-auto px-6 py-10 space-y-10">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">MushroomHLDS</h1>
        <p class="text-slate-400 text-sm mt-1">GoldSrc Server Suite & Host Controller</p>
      </div>

      <button 
        @click="showCreateModal = true"
        class="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 cursor-pointer active:scale-95"
      >
        + Add HLDS Instance
      </button>
    </header>

    <!-- Host System Stats -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <HostStatCard title="Host Load" :value="`${stats.cpuLoad} %`" type="CPU" />
      <HostStatCard title="Memory Usage" :value="`${stats.memUsed} / ${stats.memTotal} GB`" type="RAM" />
      <HostStatCard title="Host Uptime" :value="stats.uptime" type="UP" />
    </section>

    <!-- Active Game Servers -->
    <section class="space-y-4">
      <h2 class="text-lg font-bold text-white">Active Game Servers</h2>
      
      <div v-if="servers.length === 0" class="bg-[#121829] border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
        No active game servers running. Click <strong>+ Add HLDS Instance</strong> to launch or import one.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServerMushroomCard 
          v-for="server in servers" 
          :key="server.id" 
          :server="server" 
          @refresh="fetchData" 
        />
      </div>
    </section>

    <!-- Platform Action Logs -->
    <ActionLogs :logs="logs" />

    <!-- Create / Import Instance Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="bg-[#121829] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-xl font-bold text-white">Add or Import HLDS Instance</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="createInstance" class="space-y-4">
          <!-- Deployment Type Toggle -->
          <div class="grid grid-cols-2 gap-2 p-1 bg-[#0b0e17] rounded-xl border border-slate-800">
            <button 
              type="button" 
              @click="form.freshInstall = true"
              :class="form.freshInstall ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'"
              class="py-2 text-xs rounded-lg transition-all"
            >
              Fresh Container
            </button>
            <button 
              type="button" 
              @click="form.freshInstall = false"
              :class="!form.freshInstall ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'"
              class="py-2 text-xs rounded-lg transition-all"
            >
              Import Existing Directory
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server ID</label>
              <input v-model="form.id" type="text" placeholder="cs-ichim" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Game Mod</label>
              <select v-model="form.game" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option value="cstrike">Counter-Strike 1.6 (cstrike)</option>
                <option value="valve">Half-Life Deathmatch (valve)</option>
                <option value="czero">Condition Zero (czero)</option>
                <option value="dod">Day of Defeat (dod)</option>
                <option value="tfc">Team Fortress Classic (tfc)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server Name</label>
            <input v-model="form.name" type="text" placeholder="CS.iCHiM.NET" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div v-if="!form.freshInstall">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Host Directory Path</label>
            <input v-model="form.customPath" type="text" placeholder="/srv/hlds/servers/cs-ichim" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">UDP Port</label>
              <input v-model.number="form.port" type="number" placeholder="27015" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">RCON Password</label>
              <input v-model="form.rconPassword" type="password" placeholder="••••••••" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="flex items-center space-x-6 pt-2">
            <label class="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input v-model="form.installMetamod" type="checkbox" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0" />
              <span>Metamod Linked</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input v-model="form.installAmxmodx" type="checkbox" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0" />
              <span>AMX Mod X Linked</span>
            </label>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" @click="showCreateModal = false" :disabled="isSubmitting" class="px-4 py-2 text-slate-400 hover:text-white font-medium text-sm">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 inline-flex items-center gap-2">
              <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ isSubmitting ? 'Saving Instance...' : (form.freshInstall ? 'Create Container' : 'Import Instance') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HostStatCard from './components/HostStatCard.vue';
import ServerMushroomCard from './components/ServerMushroomCard.vue';
import ActionLogs from './components/ActionLogs.vue';

const stats = ref({ cpuLoad: '0', memUsed: '0', memTotal: '0', uptime: '00:00' });
const servers = ref([]);
const logs = ref([]);
const showCreateModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const form = ref({
  id: '',
  name: '',
  port: 27015,
  rconPassword: '',
  game: 'cstrike',
  installMetamod: true,
  installAmxmodx: true,
  freshInstall: true,
  customPath: ''
});

let timer = null;

async function fetchData() {
  try {
    const [statsRes, serversRes, logsRes] = await Promise.all([
      fetch('/api/host/stats').then(r => r.json()),
      fetch('/api/servers').then(r => r.json()),
      fetch('/api/audit-logs').then(r => r.json())
    ]);

    stats.value = statsRes;
    servers.value = serversRes;
    logs.value = logsRes;
  } catch (err) {
    console.error('Failed to update dashboard data', err);
  }
}

async function createInstance() {
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch('/api/servers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });

    const data = await res.json();

    if (res.ok) {
      showCreateModal.value = false;
      form.value = { id: '', name: '', port: 27015, rconPassword: '', game: 'cstrike', installMetamod: true, installAmxmodx: true, freshInstall: true, customPath: '' };
      await fetchData();
    } else {
      errorMessage.value = data.error || data.message || 'Failed to save instance.';
    }
  } catch (err) {
    errorMessage.value = 'Network error connecting to backend.';
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchData();
  timer = setInterval(fetchData, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>