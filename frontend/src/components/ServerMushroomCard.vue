<template>
  <div class="bg-[#121829] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-black flex items-center justify-center text-sm">
          HL
        </div>
        <div>
          <h3 class="font-bold text-white text-base leading-tight">{{ server.name }}</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            <span v-if="server.status === 'installing'" class="text-amber-400 font-medium inline-flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Installing...
            </span>
            <span v-else-if="server.status === 'online'" class="text-emerald-400 font-medium">
              {{ server.map }} • {{ server.players }}/{{ server.max_players }} Players
            </span>
            <span v-else class="text-red-400 font-medium">Offline</span>
          </p>
        </div>
      </div>

      <!-- Action Controls -->
      <div class="flex items-center space-x-1 bg-[#0b0e17] border border-slate-800 rounded-xl p-1">
        <button 
          @click="handleControl('start')" 
          :disabled="server.status === 'installing' || server.status === 'online'"
          class="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Start"
        >
          ▶
        </button>
        <button 
          @click="handleControl('restart')" 
          :disabled="server.status === 'installing'"
          class="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Restart"
        >
          ↻
        </button>
        <button 
          @click="handleControl('stop')" 
          :disabled="server.status === 'installing' || server.status === 'offline'"
          class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Stop"
        >
          ■
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
      <span class="font-mono text-slate-500">127.0.0.1:{{ server.port }}</span>
      <div class="flex items-center space-x-2">
        <button 
          @click="$emit('edit', server)"
          class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          ⚙ Edit
        </button>
        <button 
          @click="$emit('rcon', server)"
          :disabled="server.status !== 'online'"
          class="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          RCON Console
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  server: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['refresh', 'edit', 'rcon']);

async function handleControl(action) {
  try {
    const res = await fetch(`/api/servers/${encodeURIComponent(props.server.id)}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      emit('refresh');
    }
  } catch (err) {
    console.error('Failed to control container', err);
  }
}
</script>