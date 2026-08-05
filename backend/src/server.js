import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { getHostStats } from './services/sysStats.js';
import { executeRcon } from './services/rcon.js';
import { createServerInstance, controlContainer } from './services/hldsManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

await fastify.register(websocket);

// Serve static frontend files in production
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/'
});

// System stats route
fastify.get('/api/host/stats', async () => getHostStats());

// Audit logs (Last 15)
fastify.get('/api/audit-logs', async () => {
  return db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 15').all();
});

function logAction(action, user = 'Admin') {
  db.prepare('INSERT INTO audit_logs (action, user) VALUES (?, ?)').run(action, user);
}

// Fetch server status & plugins
fastify.get('/api/servers', async () => {
  const servers = db.prepare('SELECT * FROM servers').all();
  return servers;
});

// Create new HLDS instance
fastify.post('/api/servers/create', async (req, reply) => {
  const { id, name, port, rconPassword, game, installMetamod, installAmxmodx, freshInstall } = req.body;
  await createServerInstance({ id, name, port, rconPassword, game, installMetamod, installAmxmodx, freshInstall });
  logAction(`Created HLDS server: ${name}`);
  return { success: true };
});

// Control container power state
fastify.post('/api/servers/:id/power', async (req, reply) => {
  const { action } = req.body;
  const { id } = req.params;
  const success = await controlContainer(id, action);
  if (success) {
    logAction(`Power action [${action.toUpperCase()}] executed on server ${id}`);
    return { success: true };
  }
  return reply.status(500).send({ error: 'Failed to control instance container' });
});

// UDP RCON execution
fastify.post('/api/servers/:id/rcon', async (req, reply) => {
  const { command } = req.body;
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!server) return reply.status(404).send({ error: 'Server missing' });

  try {
    const output = await executeRcon(server.ip, server.port, server.rcon_password, command);
    logAction(`RCON command [${command}] sent to ${server.name}`);
    return { output };
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
});