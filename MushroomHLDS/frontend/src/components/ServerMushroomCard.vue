<template>
  <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-sm hover:border-slate-700 transition">
    <div class="flex items-center justify-between">
      
      <div class="flex items-center space-x-3.5">
        <div 
          :class="server.status === 'Online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'" 
          class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold relative"
        >
          HL
          <span v-if="server.status === 'Online'" class="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
        </div>

        <div>
          <h3 class="font-semibold text-white text-base leading-tight">{{ server.name }}</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ server.map }} • <span class="text-emerald-400 font-semibold">{{ server.players }}/{{ server.maxPlayers }} Players</span>
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button @click="$emit('toggle', { id: server.id, action: 'start' })" class="w-8 h-8 rounded-xl text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition">▶</button>
        <button @click="$emit('toggle', { id: server.id, action: 'restart' })" class="w-8 h-8 rounded-xl text-amber-400 hover:bg-amber-500/10 flex items-center justify-center transition">↻</button>
        <button @click="$emit('toggle', { id: server.id, action: 'stop' })" class="w-8 h-8 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition">■</button>
      </div>

    </div>

    <!-- Active Mods Indicators -->
    <div class="mt-3 flex items-center space-x-2">
      <span v-if="server.metamod" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Metamod</span>
      <span v-if="server.amxmodx" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">AMX Mod X</span>
    </div>

    <div class="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
      <span class="text-slate-500 font-mono">{{ server.ip }}:{{ server.port }}</span>
      <button @click="$emit('open-rcon', server)" class="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600/30 font-medium transition">
        RCON Console
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps(['server']);
defineEmits(['toggle', 'open-rcon']);
</script>