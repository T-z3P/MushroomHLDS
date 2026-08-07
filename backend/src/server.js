import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './db.js';
import { getHostStats } from './services/sysStats.js';
import { createServerInstance, updateServerInstance, deleteServerInstance, controlContainer, getServersWithLiveStatus } from './services/hldsManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/'
});

fastify.get('/api/host/stats', async () => {
  return await getHostStats();
});

fastify.get('/api/servers', async () => {
  return await getServersWithLiveStatus();
});

fastify.post('/api/servers/create', async (request, reply) => {
  try {
    const result = await createServerInstance(request.body);
    db.prepare('INSERT INTO audit_logs (action, user) VALUES (?, ?)').run(`Created server instance: ${request.body.name}`, 'Admin');
    return result;
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
});

fastify.post('/api/servers/update', async (request, reply) => {
  try {
    const { id, ...data } = request.body;
    const result = await updateServerInstance(id, data);
    db.prepare('INSERT INTO audit_logs (action, user) VALUES (?, ?)').run(`Updated server configuration: ${data.name}`, 'Admin');
    return result;
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
});

fastify.post('/api/servers/delete', async (request, reply) => {
  try {
    const { id, deleteFiles } = request.body;
    const result = await deleteServerInstance(id, deleteFiles);
    db.prepare('INSERT INTO audit_logs (action, user) VALUES (?, ?)').run(`Deleted server instance #${id} (Files purged: ${deleteFiles})`, 'Admin');
    return result;
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
});

fastify.post('/api/servers/:id/control', async (request, reply) => {
  const { id } = request.params;
  const { action } = request.body;
  const success = await controlContainer(id, action);
  if (success) {
    db.prepare('INSERT INTO audit_logs (action, user) VALUES (?, ?)').run(`Executed ${action} on ${id}`, 'Admin');
    return { success: true };
  }
  reply.status(500).send({ error: `Failed to ${action} server` });
});

fastify.get('/api/audit-logs', async () => {
  return db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 15').all();
});

const start = async () => {
  try {
    await fastify.listen({ port: 1337, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();