<template>
  <div class="max-w-7xl mx-auto px-6 py-10 space-y-10">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">MushroomHLDS</h1>
        <p class="text-slate-400 text-sm mt-1">GoldSrc Server Suite & Host Controller</p>
      </div>

      <button 
        @click="openAddModal"
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
        No active game servers running. Click <strong>+ Add HLDS Instance</strong> to launch or link one.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServerMushroomCard 
          v-for="server in servers" 
          :key="server.id" 
          :server="server" 
          @refresh="fetchData" 
          @edit="openEditModal"
        />
      </div>
    </section>

    <!-- Platform Action Logs -->
    <ActionLogs :logs="logs" />

    <!-- Add / Link Server Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div class="bg-[#121829] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-xl font-bold text-white">Add New Server</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="submitAdd" class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Game</label>
              <select v-model="form.game" @change="updateCmdTemplate" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option value="cstrike">Counter-Strike 1.6</option>
                <option value="valve">Half-Life Deathmatch</option>
                <option value="czero">Condition Zero</option>
                <option value="dod">Day of Defeat</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server ID</label>
              <input v-model="form.id" type="text" placeholder="cs-server-1" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server Name</label>
            <input v-model="form.name" type="text" placeholder="CS 1.6 Public Server" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server Port</label>
              <input v-model.number="form.port" type="number" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Query Port</label>
              <input v-model.number="form.queryPort" type="number" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Slots</label>
              <input v-model.number="form.slots" type="number" min="1" max="32" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Default Map</label>
              <input v-model="form.map" type="text" placeholder="de_dust2" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pingboost</label>
              <select v-model.number="form.pingboost" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                <option :value="1">1 (Low CPU)</option>
                <option :value="2">2 (Balanced)</option>
                <option :value="3">3 (High Performance)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">RCON Password</label>
            <input v-model="form.rconPassword" type="password" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Command Template</label>
            <textarea v-model="form.startCmd" rows="2" class="w-full font-mono text-xs bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-indigo-300 focus:outline-none focus:border-indigo-500"></textarea>
          </div>

          <!-- Action Selection -->
          <div class="pt-2 border-t border-slate-800 space-y-3">
            <span class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Select an Action to Perform:</span>
            
            <label class="flex items-start space-x-3 cursor-pointer">
              <input type="radio" value="link" v-model="form.actionType" class="mt-1 text-indigo-600 focus:ring-0" />
              <div>
                <span class="font-semibold text-white block">Link An Existing Game Server</span>
                <span class="text-xs text-slate-400">Attach an already compiled server binary on the host machine.</span>
              </div>
            </label>

            <div v-if="form.actionType === 'link'" class="pl-7 space-y-2">
              <label class="block text-xs text-slate-400">Absolute Path of the Server Executable</label>
              <input v-model="form.execPath" type="text" placeholder="/srv/hlds/servers/cs16/hlds_run" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <label class="flex items-start space-x-3 cursor-pointer">
              <input type="radio" value="create" v-model="form.actionType" class="mt-1 text-indigo-600 focus:ring-0" />
              <div>
                <span class="font-semibold text-white block">Create A New Game Server</span>
                <span class="text-xs text-slate-400">Download and initialize new GoldSrc server files via SteamCMD.</span>
              </div>
            </label>

            <div v-if="form.actionType === 'create'" class="pl-7 space-y-2">
              <label class="block text-xs text-slate-400">Absolute Path for the New Game Server Directory</label>
              <input v-model="form.customPath" type="text" placeholder="/srv/hlds/servers/cs16/" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" @click="showAddModal = false" class="px-4 py-2 text-slate-400 hover:text-white font-medium">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : 'Add New Server' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Server Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div class="bg-[#121829] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-xl font-bold text-white">Edit Server Entry: {{ editForm.id }}</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form @submit.prevent="submitEdit" class="space-y-4 text-sm">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server Name</label>
            <input v-model="editForm.name" type="text" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Server Port</label>
              <input v-model.number="editForm.port" type="number" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Query Port</label>
              <input v-model.number="editForm.query_port" type="number" required class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Default Map</label>
              <input v-model="editForm.map" type="text" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Max Slots</label>
              <input v-model.number="editForm.max_players" type="number" class="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Command Template</label>
            <textarea v-model="editForm.start_cmd" rows="2" class="w-full font-mono text-xs bg-[#0b0e17] border border-slate-800 rounded-xl px-4 py-2 text-indigo-300 focus:outline-none focus:border-indigo-500"></textarea>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" @click="showEditModal = false" class="px-4 py-2 text-slate-400 hover:text-white font-medium">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50">
              Save Changes
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
const showAddModal = ref(false);
const showEditModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const form = ref({
  id: '',
  name: '',
  game: 'cstrike',
  port: 27015,
  queryPort: 27015,
  slots: 32,
  map: 'de_dust2',
  pingboost: 2,
  rconPassword: '',
  startCmd: '',
  actionType: 'create',
  customPath: '',
  execPath: ''
});

const editForm = ref({});

function updateCmdTemplate() {
  form.value.startCmd = `./hlds_run -game ${form.value.game} +ip {ip} +port {port} +maxplayers {slots} +map {cfg1} -pingboost {cfg2} -autoupdate`;
}

function openAddModal() {
  updateCmdTemplate();
  showAddModal.value = true;
}

function openEditModal(server) {
  editForm.value = { ...server };
  showEditModal.value = true;
}

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

async function submitAdd() {
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch('/api/servers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });

    if (res.ok) {
      showAddModal.value = false;
      await fetchData();
    } else {
      const data = await res.json();
      errorMessage.value = data.error || 'Failed to save server instance.';
    }
  } catch (err) {
    errorMessage.value = 'Network error connecting to backend.';
  } finally {
    isSubmitting.value = false;
  }
}

async function submitEdit() {
  isSubmitting.value = true;
  try {
    const res = await fetch('/api/servers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm.value)
    });

    if (res.ok) {
      showEditModal.value = false;
      await fetchData();
    }
  } catch (err) {
    console.error('Failed to update server instance', err);
  } finally {
    isSubmitting.value = false;
  }
}

let timer = null;
onMounted(() => {
  fetchData();
  timer = setInterval(fetchData, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>