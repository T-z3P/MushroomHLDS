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
    ip TEXT DEFAULT '127.0.0.1',
    port INTEGER NOT NULL,
    query_port INTEGER DEFAULT 27015,
    rcon_password TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    game TEXT DEFAULT 'cstrike',
    map TEXT DEFAULT 'de_dust2',
    players INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 32,
    pingboost INTEGER DEFAULT 2,
    start_cmd TEXT,
    container_id TEXT,
    installed_path TEXT,
    exec_path TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user TEXT DEFAULT 'Admin',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const columns = db.prepare("PRAGMA table_info(servers)").all().map(c => c.name);

const newCols = [
  ['query_port', 'INTEGER DEFAULT 27015'],
  ['pingboost', 'INTEGER DEFAULT 2'],
  ['start_cmd', 'TEXT'],
  ['exec_path', 'TEXT'],
  ['game', "TEXT DEFAULT 'cstrike'"],
  ['status', "TEXT DEFAULT 'offline'"]
];

for (const [col, type] of newCols) {
  if (!columns.includes(col)) {
    db.exec(`ALTER TABLE servers ADD COLUMN ${col} ${type}`);
  }
}

export default db;