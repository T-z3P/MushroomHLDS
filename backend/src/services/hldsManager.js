import Docker from 'dockerode';
import db from '../db.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function ensureImageExists(imageName) {
  const images = await docker.listImages();
  const exists = images.some(img => img.RepoTags && img.RepoTags.includes(imageName));

  if (!exists) {
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (pullErr, output) => {
          if (pullErr) return reject(pullErr);
          resolve(output);
        });
      });
    });
  }
}

export async function createServerInstance(params) {
  const {
    id,
    name,
    port,
    queryPort = port,
    rconPassword,
    game = 'cstrike',
    map = 'de_dust2',
    slots = 32,
    pingboost = 2,
    startCmd = '',
    actionType = 'create',
    customPath = '',
    execPath = ''
  } = params;

  const imageName = 'cm2network/steamcmd:latest';
  const containerName = `mushroom-hlds_${id}`;
  const hostMountPath = customPath || `/srv/hlds/${id}`;
  const isFresh = actionType === 'create';
  const initialStatus = isFresh ? 'installing' : 'offline';

  const formattedCmd = startCmd || `./hlds_run -game ${game} +ip 0.0.0.0 +port ${port} +maxplayers ${slots} +map ${map} -pingboost ${pingboost} +rcon_password ${rconPassword}`;

  db.prepare(`
    INSERT INTO servers (id, name, ip, port, query_port, rcon_password, status, game, map, players, max_players, pingboost, start_cmd, installed_path, exec_path, container_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      port=excluded.port,
      query_port=excluded.query_port,
      rcon_password=excluded.rcon_password,
      game=excluded.game,
      map=excluded.map,
      max_players=excluded.max_players,
      pingboost=excluded.pingboost,
      start_cmd=excluded.start_cmd,
      installed_path=excluded.installed_path,
      exec_path=excluded.exec_path
  `).run(id, name, '127.0.0.1', port, queryPort, rconPassword, initialStatus, game, map, 0, slots, pingboost, formattedCmd, hostMountPath, execPath, containerName);

  if (isFresh) {
    await ensureImageExists(imageName);

    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.remove({ force: true });
    } catch (e) {}

    // 1. Grant permissions to /home/steam/hlds inside container
    // 2. Run steamcmd to install App 90 with -beta steam_legacy
    // 3. Fallback to hlds_linux wrapper if hlds_run is missing
    const initScript = `
      mkdir -p /home/steam/hlds && 
      chmod -R 777 /home/steam/hlds && 
      cd /home/steam/hlds && 
      /home/steam/steamcmd/steamcmd.sh +force_install_dir /home/steam/hlds +login anonymous +app_set_config 90 mod ${game} +app_update 90 -beta steam_legacy validate +quit && 
      if [ ! -f /home/steam/hlds/hlds_run ] && [ -f /home/steam/hlds/hlds_linux ]; then 
        echo '#!/bin/bash\\nexport LD_LIBRARY_PATH=.:$LD_LIBRARY_PATH\\n./hlds_linux "$@"' > /home/steam/hlds/hlds_run && 
        chmod +x /home/steam/hlds/hlds_run; 
      fi && 
      if [ -f /home/steam/hlds/hlds_run ] || [ -f /home/steam/hlds/hlds_linux ]; then 
        chmod -R 755 /home/steam/hlds && 
        ${formattedCmd}; 
      else 
        echo "HLDS installation failed: hlds_run/hlds_linux missing"; 
        sleep 30; 
      fi
    `.replace(/\s+/g, ' ').trim();

    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      User: 'root',
      Tty: true,
      Cmd: ['bash', '-c', initScript],
      ExposedPorts: {
        [`${port}/udp`]: {},
        [`${port}/tcp`]: {},
        [`${queryPort}/udp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${port}/udp`]: [{ HostPort: String(port) }],
          [`${port}/tcp`]: [{ HostPort: String(port) }],
          [`${queryPort}/udp`]: [{ HostPort: String(queryPort) }]
        },
        Binds: [
          `${hostMountPath}:/home/steam/hlds`
        ],
        RestartPolicy: { Name: 'unless-stopped' }
      }
    });

    await container.start();
  }

  return { success: true };
}

export async function updateServerInstance(id, params) {
  const { name, port, queryPort, rconPassword, game, map, slots, pingboost, startCmd } = params;

  db.prepare(`
    UPDATE servers SET 
      name = ?, port = ?, query_port = ?, rcon_password = ?, game = ?, map = ?, max_players = ?, pingboost = ?, start_cmd = ?
    WHERE id = ?
  `).run(name, port, queryPort, rconPassword, game, map, slots, pingboost, startCmd, id);

  return { success: true };
}

export async function controlContainer(id, action) {
  try {
    const containerName = `mushroom-hlds_${id}`;
    const container = docker.getContainer(containerName);

    if (action === 'start') await container.start();
    if (action === 'stop') await container.stop();
    if (action === 'restart') await container.restart();

    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run(
      action === 'stop' ? 'offline' : 'online',
      id
    );
    return true;
  } catch (err) {
    console.error(`Failed to execute ${action} on container mushroom-hlds_${id}:`, err);
    return false;
  }
}