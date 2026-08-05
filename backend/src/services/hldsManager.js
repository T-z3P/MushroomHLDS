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

  if (freshInstall) {
    await ensureImageExists(imageName);

    // Remove existing container if it exists with the same name
    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.remove({ force: true });
    } catch (e) {
      // Container didn't exist, proceed
    }

    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true,
      Cmd: [
        'bash', '-c',
        `/home/steam/steamcmd/steamcmd.sh +force_install_dir /home/steam/hlds +login anonymous +app_update 90 -game ${game} validate +quit && /home/steam/hlds/hlds_run -game ${game} +ip 0.0.0.0 +port ${port} +maxplayers 32 +map de_dust2 +rcon_password ${rconPassword}`
      ],
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

  db.prepare(`
    INSERT INTO servers (id, name, ip, port, rcon_password, status, map, players, max_players, installed_path, container_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      port=excluded.port,
      rcon_password=excluded.rcon_password,
      installed_path=excluded.installed_path,
      container_id=excluded.container_id
  `).run(id, name, '127.0.0.1', port, rconPassword, freshInstall ? 'online' : 'offline', 'de_dust2', 0, 32, hostMountPath, containerName);

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