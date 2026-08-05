import Docker from 'dockerode';
import db from '../db.js';
import fs from 'fs';
import path from 'path';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function createServerInstance({ id, name, port, rconPassword, game, installMetamod, installAmxmodx, freshInstall }) {
  const hostPath = `/srv/hlds/servers/${id}`;
  const containerPath = `/hlds_data/${id}`;

  if (!fs.existsSync(containerPath)) {
    fs.mkdirSync(containerPath, { recursive: true });
  }

  // 1. Fetch clean server via SteamCMD if fresh install requested
  if (freshInstall) {
    await docker.run('cm2network/steamcmd', [
      '+force_install_dir', `/data`,
      '+login', 'anonymous',
      '+app_update', '90', 'validate',
      '+quit'
    ], process.stdout, {
      Binds: [`${hostPath}:/data`]
    });
  }

  // 2. Metamod & AMX Mod X Auto-Injection into server structure
  const gameDir = path.join(containerPath, game || 'cstrike');
  const addonsDir = path.join(gameDir, 'addons');
  
  if (installMetamod || installAmxmodx) {
    fs.mkdirSync(path.join(addonsDir, 'metamod/dlls'), { recursive: true });
    
    // Config liblist.gam for Metamod attachment
    const liblistPath = path.join(gameDir, 'liblist.gam');
    if (fs.existsSync(liblistPath)) {
      let liblist = fs.readFileSync(liblistPath, 'utf8');
      liblist = liblist.replace(/gamedll\s+".*?"/, 'gamedll "addons/metamod/dlls/metamod.so"');
      fs.writeFileSync(liblistPath, liblist);
    }
  }

  if (installAmxmodx) {
    fs.mkdirSync(path.join(addonsDir, 'amxmodx/plugins'), { recursive: true });
    fs.mkdirSync(path.join(addonsDir, 'amxmodx/configs'), { recursive: true });
    
    // Register AMX Mod X inside Metamod's plugins.ini
    const pluginsIniPath = path.join(addonsDir, 'metamod/plugins.ini');
    const amxLine = 'linux addons/amxmodx/dlls/amxmodx_mm.so\n';
    fs.writeFileSync(pluginsIniPath, amxLine);
  }

  // Save server metadata
  db.prepare(`
    INSERT INTO servers (id, name, port, rcon_password, game, metamod, amxmodx, autostart)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, port, rconPassword, game, installMetamod ? 1 : 0, installAmxmodx ? 1 : 0);
}

export async function controlContainer(id, action) {
  const containerName = `hlds_${id}`;
  try {
    const container = docker.getContainer(containerName);
    if (action === 'start') await container.start();
    if (action === 'stop') await container.stop();
    if (action === 'restart') await container.restart();
    return true;
  } catch (err) {
    return false;
  }
}