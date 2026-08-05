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
  const { id, name, port, rconPassword, game = 'cstrike', freshInstall = true, customPath = '' } = params;
  const imageName = 'cm2network/steamcmd:latest';
  const containerName = `mushroom-hlds_${id}`;
  const hostMountPath = customPath || `/srv/hlds/servers/${id}`;

  const initialStatus = freshInstall ? 'installing' : 'online';

  db.prepare(`
    INSERT INTO servers (id, name, ip, port, rcon_password, status, map, game, players, max_players, installed_path, container_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      port=excluded.port,
      rcon_password=excluded.rcon_password,
      status=excluded.status,
      game=excluded.game,
      installed_path=excluded.installed_path,
      container_id=excluded.container_id
  `).run(id, name, '127.0.0.1', port, rconPassword, initialStatus, 'de_dust2', game, 0, 32, hostMountPath, containerName);

  if (freshInstall) {
    await ensureImageExists(imageName);

    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.remove({ force: true });
    } catch (e) {
      // Container didn't exist
    }

    // Shell script executed inside the container
    const initScript = `
      mkdir -p /home/steam/hlds && 
      /home/steam/steamcmd/steamcmd.sh +force_install_dir /home/steam/hlds +login anonymous +app_update 90 validate +quit && 
      /home/steam/steamcmd/steamcmd.sh +force_install_dir /home/steam/hlds +login anonymous +app_set_config 90 mod ${game} +app_update 90 -beta steam_legacy validate +quit && 
      if [ -f /home/steam/hlds/hlds_run ]; then 
        chmod +x /home/steam/hlds/hlds_run && 
        /home/steam/hlds/hlds_run -game ${game} +ip 0.0.0.0 +port ${port} +maxplayers 32 +map de_dust2 +rcon_password ${rconPassword}; 
      else 
        echo "HLDS installation failed: hlds_run binary not found in /home/steam/hlds"; 
        sleep 60; 
      fi
    `.replace(/\s+/g, ' ').trim();

    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true,
      Cmd: ['bash', '-c', initScript],
      ExposedPorts: {
        [`${port}/udp`]: {},
        [`${port}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${port}/udp`]: [{ HostPort: String(port) }],
          [`${port}/tcp`]: [{ HostPort: String(port) }]
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