<template>
  <div class="bg-[#121829] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
    <h3 class="text-sm font-bold text-slate-300 tracking-wider uppercase mb-4">
      Last 15 Platform Actions
    </h3>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <th class="pb-3 px-3">ID</th>
            <th class="pb-3 px-3">Action Description</th>
            <th class="pb-3 px-3">User</th>
            <th class="pb-3 px-3">Timestamp</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/50 text-sm">
          <tr v-if="logs.length === 0">
            <td colspan="4" class="py-8 text-center text-slate-500 font-medium">
              No actions recorded
            </td>
          </tr>
          <tr v-else v-for="log in logs" :key="log.id" class="hover:bg-slate-800/30 transition-colors">
            <td class="py-3 px-3 text-slate-500 font-mono text-xs">#{{ log.id }}</td>
            <td class="py-3 px-3 font-medium text-slate-200">{{ log.action }}</td>
            <td class="py-3 px-3 text-slate-400">{{ log.user || 'Admin' }}</td>
            <td class="py-3 px-3 text-slate-500 text-xs">{{ formatDate(log.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: {
    type: Array,
    default: () => []
  }
});

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}
</script>