import tmi from "tmi.js";
import "dotenv/config";

import { tienePermiso } from "./permissions.js";
import { responderChatGPT } from "./chatgpt.js";
import { guardarMensaje } from "./memory.js";
import fetch from "node-fetch";

// =======================
// CONFIGURACIÓN DEL CLIENTE
// =======================
// Ahora soporta múltiples canales separados por comas en .env
const canales = process.env.CHANNELS.split(",").map((c) => c.trim());

const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH,
  },
  channels: canales,
});

client.connect();

// =======================
// COOLDOWN DINÁMICO
// =======================
const cooldownUsuarios = new Map(); // canal -> usuario -> timestamp
const estadoCanales = new Map(); // cache de 60s: canal -> { online: true/false, timestamp }

// Devuelve si un usuario puede hablar en un canal
async function puedeHablar(usuario, canal) {
  const ahora = Date.now();
  const cooldown = await obtenerCooldown(canal);

  if (!cooldownUsuarios.has(canal)) cooldownUsuarios.set(canal, new Map());
  const canalMap = cooldownUsuarios.get(canal);
  const ultimo = canalMap.get(usuario) || 0;

  if (ahora - ultimo < cooldown) return false;

  canalMap.set(usuario, ahora);
  return true;
}

// Obtiene el cooldown dinámico según el estado del canal (cache de 60s)
async function obtenerCooldown(canal) {
  const ahora = Date.now();

  // Revisamos cache
  if (estadoCanales.has(canal)) {
    const cached = estadoCanales.get(canal);
    if (ahora - cached.timestamp < 60 * 1000) {
      // 60s cache
      return cached.online ? 5 * 60 * 1000 : 10 * 1000;
    }
  }

  // Llamada a API Twitch
  try {
    const url = `https://api.twitch.tv/helix/streams?user_login=${canal}`;
    const res = await fetch(url, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.BOT_OAUTH.replace("oauth:", "")}`,
      },
    });
    const data = await res.json();

    const online = data.data && data.data.length > 0;

    // Guardamos en cache
    estadoCanales.set(canal, { online, timestamp: ahora });

    return online ? 5 * 60 * 1000 : 10 * 1000;
  } catch (err) {
    console.error("Error comprobando estado del stream:", err);
    return 10 * 1000; // fallback
  }
}

// =======================
// EVENTO MENSAJES
// =======================
client.on("message", async (channel, tags, message, self) => {
  if (self) return;

  const usuario = tags.username;
  const textoOriginal = message.trim();

  // 1️⃣ FASE PASIVA → LEER TODO EL CHAT
  guardarMensaje(usuario, textoOriginal);

  // 2️⃣ COOLDOWN por usuario y canal
  if (!(await puedeHablar(usuario, channel))) return;

  // 3️⃣ SOLO RESPONDER SI tiene permisos y activador "Benito,"
  if (!tienePermiso(tags)) return;
  if (!textoOriginal.toLowerCase().startsWith("benito,")) return;

  const texto = textoOriginal.replace(/^benito,\s*/i, "");

  try {
    // 4️⃣ RESPUESTA CON CHATGPT
    const respuesta = await responderChatGPT(usuario, texto);

    if (respuesta) {
      client.say(channel, `@${usuario} ${respuesta}`);
    }
  } catch (error) {
    console.error("Error al responder:", error);
    client.say(channel, `@${usuario} he tenido un problema pensando 🤖`);
  }
});
