// memory.js

// Memoria global por canal: canal -> array de mensajes {usuario, mensaje}
export const memoriaGlobal = new Map();

// Memoria por usuario por canal: canal -> usuario -> array de mensajes
export const memoriaUsuarios = new Map();

/**
 * Guarda un mensaje en memoria
 */
export function guardarMensaje(canal, usuario, mensaje) {
  // ===== Memoria global =====
  if (!memoriaGlobal.has(canal)) memoriaGlobal.set(canal, []);
  const historialGlobal = memoriaGlobal.get(canal);
  historialGlobal.push({ usuario, mensaje });
  if (historialGlobal.length > 50) historialGlobal.shift(); // últimos 50 mensajes

  // ===== Memoria por usuario =====
  if (!memoriaUsuarios.has(canal)) memoriaUsuarios.set(canal, new Map());
  const canalMap = memoriaUsuarios.get(canal);

  if (!canalMap.has(usuario)) canalMap.set(usuario, []);
  const historialUsuario = canalMap.get(usuario);
  historialUsuario.push(mensaje);
  if (historialUsuario.length > 20) historialUsuario.shift(); // últimos 20 mensajes por usuario
}

/**
 * Recupera el historial de un usuario en un canal
 */
export function obtenerUsuario(canal, usuario) {
  if (memoriaUsuarios.has(canal)) {
    const canalMap = memoriaUsuarios.get(canal);
    if (canalMap.has(usuario)) return canalMap.get(usuario);
  }
  return [];
}

/**
 * Recupera el historial global de un canal
 */
export function obtenerGlobal(canal) {
  if (memoriaGlobal.has(canal))
    return memoriaGlobal.get(canal).map((m) => `${m.usuario}: ${m.mensaje}`);
  return [];
}
