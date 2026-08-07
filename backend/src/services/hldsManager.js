import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { GameDig } from 'gamedig';
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

export async function getServersWithLiveStatus() {
  const servers = db.prepare('SELECT * FROM servers').all();

  for (const server of servers) {
    const containerName = server.container_id || `mushroom-hlds_${server.id}`;

    try {
      const container = docker.getContainer(containerName);
      const inspect = await container.inspect();

      if (inspect.State.Running) {
        server.status = 'online';

        try {
          const state = await GameDig.query({
            type: 'cs16',
            host: '127.0.0.1',
            port: Number(server.port)
          });

          server.map = state.map || server.map;
          server.players = state.players ? state.players.length : server.players;
          server.max_players = state.maxplayers || server.max_players;

          db.prepare('UPDATE servers SET status = ?, map = ?, players = ?, max_players = ? WHERE id = ?').run(
            'online',
            server.map,
            server.players,
            server.max_players,
            server.id
          );
        } catch (queryErr) {
          db.prepare("UPDATE servers SET status = 'online' WHERE id = ?").run(server.id);
        }
      } else {
        server.status = 'offline';
        db.prepare("UPDATE servers SET status = 'offline' WHERE id = ?").run(server.id);
      }
    } catch (err) {
      server.status = 'offline';
      db.prepare("UPDATE servers SET status = 'offline' WHERE id = ?").run(server.id);
    }
  }

  return servers;
}

export async function createServerInstance(params) {
  const {
    id,
    name,
    port = 27015,
    queryPort = port,
    rconPassword = 'admin',
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

  const hostMountPath = actionType === 'link'
    ? (execPath ? execPath.substring(0, execPath.lastIndexOf('/')) : `/srv/hlds/servers/${id}`)
    : (customPath || `/srv/hlds/servers/${id}`);

  const cleanMap = (map && !map.includes('{')) ? map : 'de_dust2';
  const cleanSlots = Number(slots) || 32;
  const cleanPingboost = Number(pingboost) || 2;

  const formattedCmd = startCmd && !startCmd.includes('{cfg1}') 
    ? startCmd 
    : `./hlds_run -game ${game} +ip 0.0.0.0 +port ${port} +maxplayers ${cleanSlots} +map ${cleanMap} -pingboost ${cleanPingboost} +rcon_password ${rconPassword}`;

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
      exec_path=excluded.exec_path,
      container_id=excluded.container_id
  `).run(id, name, '127.0.0.1', port, queryPort, rconPassword, 'installing', game, cleanMap, 0, cleanSlots, cleanPingboost, formattedCmd, hostMountPath, execPath, containerName);

  await ensureImageExists(imageName);

  try {
    const oldContainer = docker.getContainer(containerName);
    await oldContainer.remove({ force: true });
  } catch (e) {}

  const initScript = actionType === 'link' ? `
    mkdir -p /home/steam/hlds && 
    cd /home/steam/hlds && 
    if [ ! -f /home/steam/hlds/hlds_run ] && [ -f /home/steam/hlds/hlds_linux ]; then 
      echo '#!/bin/bash\\nexport LD_LIBRARY_PATH=.:$LD_LIBRARY_PATH\\n./hlds_linux "$@"' > /home/steam/hlds/hlds_run && 
      chmod +x /home/steam/hlds/hlds_run; 
    fi && 
    chmod +x /home/steam/hlds/hlds_* && 
    ${formattedCmd}
  `.replace(/\s+/g, ' ').trim() : `
    mkdir -p /home/steam/hlds && 
    cd /home/steam/hlds && 
    /home/steam/steamcmd/steamcmd.sh +force_install_dir /home/steam/hlds +login anonymous +app_set_config 90 mod ${game} +app_update 90 -beta steam_legacy validate +quit && 
    if [ ! -f /home/steam/hlds/hlds_run ] && [ -f /home/steam/hlds/hlds_linux ]; then 
      echo '#!/bin/bash\\nexport LD_LIBRARY_PATH=.:$LD_LIBRARY_PATH\\n./hlds_linux "$@"' > /home/steam/hlds/hlds_run && 
      chmod +x /home/steam/hlds/hlds_run; 
    fi && 
    chmod +x /home/steam/hlds/hlds_* && 
    ${formattedCmd}
  `.replace(/\s+/g, ' ').trim();

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    User: 'steam',
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

export async function deleteServerInstance(id, deleteFiles = false) {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
  if (!server) return { success: false, error: 'Server entry not found' };

  // 1. Remove Docker Container
  const containerName = server.container_id || `mushroom-hlds_${id}`;
  try {
    const container = docker.getContainer(containerName);
    await container.stop().catch(() => {});
    await container.remove({ force: true }).catch(() => {});
  } catch (err) {
    console.error(`Container cleanup error for ${id}:`, err);
  }

  // 2. Delete Files from OS level via /hlds_data mount mapping
  if (deleteFiles && server.installed_path) {
    try {
      const folderName = path.basename(server.installed_path);
      const containerPath = path.join('/hlds_data', folderName);

      if (fs.existsSync(containerPath)) {
        fs.rmSync(containerPath, { recursive: true, force: true });
      } else if (fs.existsSync(server.installed_path)) {
        fs.rmSync(server.installed_path, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`OS file deletion error for ${server.installed_path}:`, err);
    }
  }

  // 3. Purge DB record
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);

  return { success: true };
}

export async function controlContainer(id, action) {
  try {
    const server = db.prepare('SELECT container_id FROM servers WHERE id = ?').get(id);
    const containerName = server?.container_id || `mushroom-hlds_${id}`;
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

export async function sendRconCommand(id, command) {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
  if (!server) throw new Error('Server not found');

  const state = await GameDig.query({
    type: 'cs16',
    host: '127.0.0.1',
    port: Number(server.port),
    rconPassword: server.rcon_password,
    rconCommand: command
  });

  return state.raw?.rconResponse || 'Command sent successfully.';
}