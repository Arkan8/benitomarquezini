// memory.js

// =======================
// MEMORIA GLOBAL
// =======================
export const memoriaGlobal = {
  ultimosMensajes: []
};

// =======================
// MEMORIA POR USUARIO
// =======================
export const memoriaUsuarios = new Map();

// =======================
// GUARDAR MENSAJE
// =======================
export function guardarMensaje(usuario, mensaje) {
  // Guardar en memoria global (texto plano)
  memoriaGlobal.ultimosMensajes.push(`${usuario}: ${mensaje}`);

  if (memoriaGlobal.ultimosMensajes.length > 50) {
    memoriaGlobal.ultimosMensajes.shift();
  }

  // Guardar en memoria por usuario
  if (!memoriaUsuarios.has(usuario)) {
    memoriaUsuarios.set(usuario, []);
  }

  const historialUsuario = memoriaUsuarios.get(usuario);
  historialUsuario.push(mensaje);

  if (historialUsuario.length > 20) {
    historialUsuario.shift();
  }
}

// =======================
// OBTENER MEMORIA USUARIO
// =======================
export function obtenerUsuario(usuario) {
  return memoriaUsuarios.get(usuario) || [];
}

// =======================
// OBTENER MEMORIA GLOBAL
// =======================
export function obtenerGlobal() {
  return memoriaGlobal.ultimosMensajes || [];
}
