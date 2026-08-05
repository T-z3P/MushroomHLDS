<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center space-x-4">
      <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
        CPU
      </div>
      <div>
        <p class="text-xs text-slate-400 font-medium">Host Load</p>
        <p class="text-xl font-bold text-white">{{ stats.cpu || '0.0' }} %</p>
      </div>
    </div>

    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center space-x-4">
      <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
        RAM
      </div>
      <div>
        <p class="text-xs text-slate-400 font-medium">Memory Usage</p>
        <p class="text-xl font-bold text-white">
          {{ stats.memory?.used || 0 }} / {{ stats.memory?.total || 0 }} GB
        </p>
      </div>
    </div>

    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center space-x-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
        UP
      </div>
      <div>
        <p class="text-xs text-slate-400 font-medium">Host Uptime</p>
        <p class="text-xl font-bold text-white">{{ Math.floor((stats.uptime || 0) / 3600) }} hrs</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['stats']);
</script>