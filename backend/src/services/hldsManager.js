import Docker from 'dockerode';
import db from '../db.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function ensureImageExists(imageName) {
  const images = await docker.listImages();
  const exists = images.some(img => img.RepoTags && img.RepoTags.includes(imageName));

  if (!exists) {
    console.log(`Image ${imageName} missing locally. Pulling from registry...`);
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
  const { id, name, port, rconPassword, game = 'cstrike' } = params;
  const imageName = 'cm2network/steamcmd:latest';

  // Ensure SteamCMD base image exists before starting container
  await ensureImageExists(imageName);

  const containerName = `hlds_${id}`;

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    Tty: true,
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
        `/srv/hlds/servers/${id}:/home/steam/hlds`
      ],
      RestartPolicy: { Name: 'unless-stopped' }
    },
    Env: [
      `PORT=${port}`,
      `GAME=${game}`
    ]
  });

  await container.start();

  // Save to SQLite database
  db.prepare(`
    INSERT INTO servers (id, name, ip, port, rcon_password, status, map, players, max_players)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, '127.0.0.1', port, rconPassword, 'online', 'de_dust2', 0, 32);

  return container;
}

export async function controlContainer(id, action) {
  try {
    const container = docker.getContainer(`hlds_${id}`);
    if (action === 'start') await container.start();
    if (action === 'stop') await container.stop();
    if (action === 'restart') await container.restart();

    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run(
      action === 'stop' ? 'offline' : 'online',
      id
    );
    return true;
  } catch (err) {
    console.error(`Failed to execute ${action} on container hlds_${id}:`, err);
    return false;
  }
}