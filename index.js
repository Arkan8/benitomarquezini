import tmi from "tmi.js";
import "dotenv/config";

import { tienePermiso } from "./permissions.js";
import { responderChatGPT } from "./chatgpt.js";
import { guardarMensaje, memoriaUsuarios } from "./memory.js";

// =======================
// CONFIGURACIÓN DEL CLIENTE
// =======================
const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH,
  },
  channels: [process.env.CHANNEL],
});

client
  .connect()
  .then(() => console.log("Bot conectado a Twitch correctamente"))
  .catch((err) => console.error("Error al conectar a Twitch:", err));

// =======================
// EVENTO MENSAJES
// =======================
client.on("message", async (channel, tags, message, self) => {
  if (self) return;

  const usuario = tags.username;
  const textoOriginal = message.trim();

  // 1️⃣ FASE PASIVA → LEER TODO EL CHAT
  guardarMensaje(usuario, textoOriginal);

  // 2️⃣ SOLO RESPONDER SI:
  // - Tiene permisos
  // - Empieza por "Benito,"
  if (!tienePermiso(tags)) return;
  if (!textoOriginal.toLowerCase().startsWith("benito,")) return;

  // Quitamos el activador
  const texto = textoOriginal.replace(/^benito,\s*/i, "");

  try {
    // 3️⃣ RESPUESTA CON CHATGPT (usando memoria)
    const respuesta = await responderChatGPT(usuario, texto);

    if (respuesta) {
      client.say(channel, `@${usuario} ${respuesta}`);
    }
  } catch (error) {
    console.error("Error al responder:", error);
    client.say(channel, `@${usuario} he tenido un problema pensando 🤖`);
  }
});
