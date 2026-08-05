import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'database.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    rcon_password TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    game TEXT DEFAULT 'cstrike',
    map TEXT DEFAULT 'de_dust2',
    players INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 32,
    container_id TEXT,
    installed_path TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user TEXT DEFAULT 'Admin',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const columns = db.prepare("PRAGMA table_info(servers)").all().map(c => c.name);

if (!columns.includes('status')) {
  db.exec("ALTER TABLE servers ADD COLUMN status TEXT DEFAULT 'offline'");
}
if (!columns.includes('game')) {
  db.exec("ALTER TABLE servers ADD COLUMN game TEXT DEFAULT 'cstrike'");
}
if (!columns.includes('container_id')) {
  db.exec("ALTER TABLE servers ADD COLUMN container_id TEXT");
}
if (!columns.includes('installed_path')) {
  db.exec("ALTER TABLE servers ADD COLUMN installed_path TEXT");
}

export default db;