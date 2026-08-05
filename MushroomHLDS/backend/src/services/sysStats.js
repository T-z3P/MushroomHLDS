import si from 'systeminformation';

export async function getHostStats() {
  const load = await si.currentLoad();
  const mem = await si.mem();
  const time = si.time();

  return {
    cpu: load.currentLoad.toFixed(1),
    memory: {
      used: (mem.active / (1024 ** 3)).toFixed(2),
      total: (mem.total / (1024 ** 3)).toFixed(2),
      percentage: ((mem.active / mem.total) * 100).toFixed(1)
    },
    uptime: time.uptime
  };
}