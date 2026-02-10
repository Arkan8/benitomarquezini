import Database from "better-sqlite3";

const db = new Database("memoria.db");

// Tabla global (todo el chat)
db.prepare(`
  CREATE TABLE IF NOT EXISTS global_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla por usuario
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export { db };
