<template>
  <section class="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
    <h2 class="text-md font-semibold text-slate-300 mb-3">Last 15 Platform Actions</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-400">
        <thead class="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
          <tr>
            <th class="pb-2">ID</th>
            <th class="pb-2">Action Description</th>
            <th class="pb-2">User</th>
            <th class="pb-2">Timestamp</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/50">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-800/20">
            <td class="py-2.5 font-mono text-slate-500">#{{ log.id }}</td>
            <td class="py-2.5 font-medium text-slate-200">{{ log.action }}</td>
            <td class="py-2.5 text-indigo-400">{{ log.user }}</td>
            <td class="py-2.5 font-mono text-slate-500">{{ log.timestamp }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
defineProps(['logs']);
</script>