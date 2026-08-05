import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/app/data/panel.db' 
  : path.resolve('./data.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT,
    ip TEXT DEFAULT '127.0.0.1',
    port INTEGER,
    rcon_password TEXT,
    game TEXT,
    metamod INTEGER DEFAULT 0,
    amxmodx INTEGER DEFAULT 0,
    autostart INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    user TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;