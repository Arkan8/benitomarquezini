import express from "express";
import tmi from "tmi.js";
import "dotenv/config";

import { tienePermiso } from "./permissions.js";
import { responderChatGPT } from "./chatgpt.js";
import { guardarMensaje } from "./memory.js";
import fetch from "node-fetch";

// =======================
// SERVIDOR WEB (EXPRESS)
// =======================
const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.status(200).send("Benito está despierto 😈 y en funcionamiento 🤖");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor web activo en el puerto ${PORT}`);
});

// =======================
// CONFIGURACIÓN DEL CLIENTE
// =======================
const canales = (process.env.CHANNELS || process.env.CHANNEL || "").split(",").map((c) => c.trim());

const client = new tmi.Client({
  connection: { secure: true, reconnect: true },
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

async function obtenerCooldown(canal) {
  const ahora = Date.now();

  if (estadoCanales.has(canal)) {
    const cached = estadoCanales.get(canal);
    if (ahora - cached.timestamp < 60 * 1000) {
      return cached.online ? 5 * 60 * 1000 : 10 * 1000;
    }
  }

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
    estadoCanales.set(canal, { online, timestamp: ahora });

    return online ? 5 * 60 * 1000 : 10 * 1000;
  } catch (err) {
    console.error("Error comprobando estado del stream:", err);
    return 10 * 1000;
  }
}

// =======================
// EVENTO MENSAJES
// =======================
client.on("message", async (channel, tags, message, self) => {
  if (self) return;

  const usuario = tags.username;
  const textoOriginal = message.trim();

  // 1️⃣ FASE PASIVA → LEER TODO EL CHAT (memoria por canal)
  guardarMensaje(channel, usuario, textoOriginal);

  // 2️⃣ COOLDOWN por usuario y canal
  if (!(await puedeHablar(usuario, channel))) return;

  // 3️⃣ SOLO RESPONDER SI tiene permisos y activador "Benito,"
  if (!tienePermiso(tags)) return;
  if (!textoOriginal.toLowerCase().startsWith("benito,")) return;

  const texto = textoOriginal.replace(/^benito,\s*/i, "");

  try {
    // 4️⃣ RESPUESTA CON CHATGPT (memoria por canal)
    const respuesta = await responderChatGPT(channel, usuario, texto);

    if (respuesta) {
      client.say(channel, `@${usuario} ${respuesta}`);
    }
  } catch (error) {
    console.error("Error al responder:", error);
    client.say(channel, `@${usuario} he tenido un problema pensando 🤖`);
  }
});
