<template>
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
      
      <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
        <h3 class="font-semibold text-white">Interactive RCON — {{ server.name }}</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white">✕</button>
      </div>

      <div class="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto space-y-2 text-slate-300">
        <div v-for="(log, i) in history" :key="i" :class="log.type === 'cmd' ? 'text-indigo-400' : 'text-slate-200'">
          {{ log.text }}
        </div>
      </div>

      <form @submit.prevent="sendCommand" class="p-3 border-t border-slate-800 bg-slate-900 flex space-x-2">
        <input 
          v-model="cmd" 
          type="text" 
          placeholder="e.g., amx_map de_dust2 or status" 
          class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition">
          Send
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['server']);
defineEmits(['close']);

const cmd = ref('');
const history = ref([{ type: 'output', text: 'Connected to GoldSrc RCON session...' }]);

async function sendCommand() {
  if (!cmd.value.trim()) return;
  const commandText = cmd.value;
  history.value.push({ type: 'cmd', text: `> ${commandText}` });
  cmd.value = '';

  try {
    const res = await fetch(`/api/servers/${props.server.id}/rcon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: commandText })
    }).then(r => r.json());

    history.value.push({ type: 'output', text: res.output || res.error || 'Done.' });
  } catch (err) {
    history.value.push({ type: 'output', text: 'Failed to dispatch RCON packet.' });
  }
}
</script>