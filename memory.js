import { db } from "./db.js";

export function guardarMensaje(username, texto) {
  // Guardar en memoria global
  db.prepare("INSERT INTO global_memory (username, message) VALUES (?, ?)").run(username, texto);

  // Guardar en memoria por usuario
  db.prepare("INSERT INTO user_memory (username, message) VALUES (?, ?)").run(username, texto);
}

// Recuperar últimos N mensajes de un usuario
export function obtenerUsuario(username, limit = 10) {
  return db.prepare("SELECT message FROM user_memory WHERE username=? ORDER BY id DESC LIMIT ?")
    .all(username, limit)
    .map(r => r.message)
    .reverse();
}

// Recuperar últimos N mensajes globales
export function obtenerGlobal(limit = 20) {
  return db.prepare("SELECT message FROM global_memory ORDER BY id DESC LIMIT ?")
    .all(limit)
    .map(r => r.message)
    .reverse();
}
