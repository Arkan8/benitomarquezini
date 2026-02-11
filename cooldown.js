import fetch from "node-fetch";

// Map para cooldown por canal → usuario → timestamp
const cooldownUsuarios = new Map();

/**
 * Comprueba si un usuario puede enviar un mensaje en un canal.
 * Devuelve true si puede, false si sigue en cooldown.
 */
export async function puedeHablar(usuario, canal) {
  const ahora = Date.now();

  // Obtenemos el cooldown dinámico según si el canal está online/offline
  const tiempoCooldown = await obtenerCooldown(canal);

  // Inicializamos map de canal si no existe
  if (!cooldownUsuarios.has(canal)) {
    cooldownUsuarios.set(canal, new Map());
  }

  const canalMap = cooldownUsuarios.get(canal);
  const ultimo = canalMap.get(usuario) || 0;

  if (ahora - ultimo < tiempoCooldown) {
    // Usuario todavía en cooldown
    return false;
  }

  // Actualizamos timestamp del usuario
  canalMap.set(usuario, ahora);
  return true;
}

/**
 * Devuelve el tiempo de cooldown según el estado del stream
 * online → 5 min, offline → 10 s
 */
async function obtenerCooldown(canal) {
  try {
    const url = `https://api.twitch.tv/helix/streams?user_login=${canal}`;
    const res = await fetch(url, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.BOT_OAUTH.replace("oauth:", "")}`,
      },
    });

    const data = await res.json();

    if (data.data && data.data.length > 0) {
      // Canal online
      return 5 * 60 * 1000; // 5 minutos
    } else {
      // Canal offline
      return 10 * 1000; // 10 segundos
    }
  } catch (err) {
    console.error("Error obteniendo estado del stream:", err);
    return 10 * 1000; // fallback seguro
  }
}
