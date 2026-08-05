import si from 'systeminformation';

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}, ${formattedHours}:${formattedMinutes}`;
  }
  return `${formattedHours}:${formattedMinutes}`;
}

export async function getHostStats() {
  try {
    const [currentLoad, mem, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.time()
    ]);

    return {
      cpuLoad: currentLoad.currentLoad.toFixed(1),
      memUsed: (mem.active / (1024 ** 3)).toFixed(2),
      memTotal: (mem.total / (1024 ** 3)).toFixed(2),
      memPercent: Math.round((mem.active / mem.total) * 100),
      uptime: formatUptime(time.uptime)
    };
  } catch (err) {
    return {
      cpuLoad: 0,
      memUsed: 0,
      memTotal: 0,
      memPercent: 0,
      uptime: '00:00'
    };
  }
}