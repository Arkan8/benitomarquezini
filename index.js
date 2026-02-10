import tmi from "tmi.js";
import "dotenv/config";
import { tienePermiso } from "./permissions.js";
import { guardarMensaje } from "./memory.js";
import { responderChatGPT } from "./chatgpt.js";

const client = new tmi.Client({
  connection: { secure: true, reconnect: true },
  identity: { username: process.env.BOT_USERNAME, password: process.env.BOT_OAUTH },
  channels: [process.env.CHANNEL]
});

client.connect();

client.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (!tienePermiso(tags)) return;
  if (!message.toLowerCase().startsWith("benito,")) return;

  const texto = message.replace(/^benito,\s*/i, "");

  // Guardar en memoria
  guardarMensaje(tags.username, texto);

  // Obtener respuesta de ChatGPT
  const respuesta = await responderChatGPT(tags.username, texto);

  // Enviar mensaje al chat
  client.say(channel, `@${tags.username} ${respuesta}`);
});
