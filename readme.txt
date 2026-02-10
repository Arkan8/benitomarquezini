🎯 OBJETIVO FINAL (resumen)

Tu bot:

Lee todo el chat de Twitch

NO habla solo

Responde solo si ve un string concreto (ej: !ark)

Tiene memoria por usuario y memoria general

Tiene restricciones por rol (VIP, mod, broadcaster)

Usa ChatGPT solo cuando toca

🧩 PASO 1 – Crear el usuario del bot en Twitch

El bot debe ser una cuenta real.

Crea una cuenta nueva en Twitch (ej: ArkBot)

No hace falta que sea partner ni nada

Dale VIP o mod en tu canal (opcional pero recomendable)

👉 Esto permite:

Leer el chat

Escribir mensajes

Ver roles de usuarios

🔐 PASO 2 – Obtener credenciales de Twitch

Necesitas un OAuth Token para que el bot se conecte.

Obtener token (fácil)

👉 https://twitchapps.com/tmi/

Loguéate con la cuenta del bot

Copia el token (oauth:xxxxxx)

Guárdalo, lo usarás luego.

🖥️ PASO 3 – Preparar el entorno local

Instala:

1️⃣ Node.js (LTS)

👉 https://nodejs.org

Descarga LTS

Verifica:

node -v
npm -v

2️⃣ Crear proyecto
mkdir twitch-bot
cd twitch-bot
npm init -y

3️⃣ Instalar dependencias
npm install tmi.js openai better-sqlite3 dotenv


Qué es cada cosa

tmi.js → chat Twitch

openai → ChatGPT

better-sqlite3 → memoria simple

dotenv → variables secretas

🔑 PASO 4 – Variables de entorno

Crea archivo .env:

BOT_USERNAME=ArkBot
BOT_OAUTH=oauth:XXXXXXXX
CHANNEL=tu_canal
OPENAI_API_KEY=sk-XXXXXXXX


⚠️ Nunca subas esto a GitHub

💬 PASO 5 – Conectarse al chat (leer TODO)

Crea index.js:

import tmi from "tmi.js";
import "dotenv/config";

const client = new tmi.Client({
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH
  },
  channels: [process.env.CHANNEL]
});

client.connect();

client.on("message", (channel, tags, message, self) => {
  if (self) return;
  console.log(`${tags.username}: ${message}`);
});


Ejecuta:

node index.js


✅ Si ves el chat en consola → todo bien.

🧠 PASO 6 – Sistema de permisos (VIP, mod, broadcaster)

Añade esta función:

function tienePermiso(tags) {
  return (
    tags.badges?.vip === "1" ||
    tags.mod ||
    tags.badges?.broadcaster === "1"
  );
}


Esto usa datos reales que Twitch manda.

🎛️ PASO 7 – Activador del bot (string concreto)

Decidimos:

!ark


En el listener:

if (!message.toLowerCase().startsWith("!ark")) return;


👉 El bot:

❌ ignora el resto del chat

✅ solo actúa cuando lo llaman

💾 PASO 8 – Memoria (base de datos)

Creamos db.js:

import Database from "better-sqlite3";

export const db = new Database("memoria.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS user_memory (
  username TEXT PRIMARY KEY,
  memory TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS global_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory TEXT
)
`).run();

Memoria por usuario
export function guardarMemoriaUsuario(username, texto) {
  const row = db.prepare(
    "SELECT memory FROM user_memory WHERE username = ?"
  ).get(username);

  const nuevaMemoria = row
    ? row.memory + " | " + texto
    : texto;

  db.prepare(`
    INSERT OR REPLACE INTO user_memory (username, memory)
    VALUES (?, ?)
  `).run(username, nuevaMemoria);
}

Memoria general
export function guardarMemoriaGlobal(texto) {
  db.prepare(`
    INSERT INTO global_memory (memory)
    VALUES (?)
  `).run(texto);
}

🤖 PASO 9 – Conectar con ChatGPT

Crea openai.js:

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


Función de respuesta:

export async function responder(prompt, contexto) {
  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "Eres un bot de Twitch breve y educado." },
      { role: "system", content: contexto },
      { role: "user", content: prompt }
    ]
  });

  return res.choices[0].message.content;
}

🧩 PASO 10 – Construir contexto (memoria)
function construirContexto(username) {
  const user = db.prepare(
    "SELECT memory FROM user_memory WHERE username = ?"
  ).get(username);

  const global = db.prepare(
    "SELECT memory FROM global_memory ORDER BY id DESC LIMIT 5"
  ).all();

  return `
Memoria general:
${global.map(g => "- " + g.memory).join("\n")}

Memoria del usuario (${username}):
${user?.memory || "Sin datos"}
`;
}

🔄 PASO 11 – Flujo completo final

En index.js:

client.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (!message.toLowerCase().startsWith("!ark")) return;
  if (!tienePermiso(tags)) return;

  const prompt = message.replace("!ark", "").trim();
  if (!prompt) return;

  const contexto = construirContexto(tags.username);
  const respuesta = await responder(prompt, contexto);

  client.say(channel, `@${tags.username} ${respuesta}`);
});

🧠 ¿Cómo decide qué memorizar?

Ejemplo simple:

if (message.includes("me gusta") || message.includes("soy")) {
  guardarMemoriaUsuario(tags.username, message);
}


👉 Esto lo decides tú, no ChatGPT.

🚀 PASO 12 – Hosting (opcional)

Puedes usar:

Render

Railway

VPS

Tu propio PC

Solo necesitas:

node index.js

📚 Enlaces útiles

tmi.js docs: https://tmijs.com/

Twitch IRC: https://dev.twitch.tv/docs/irc

OpenAI API: https://platform.openai.com/docs

OAuth Twitch: https://twitchapps.com/tmi/

SQLite viewer: https://sqlitebrowser.org/

✅ CONCLUSIÓN

Lo que quieres:
✔️ Es totalmente posible
✔️ Es la forma profesional
✔️ Es escalable
✔️ No depende de Fossabot

Si quieres, en el siguiente mensaje puedo:

🔹 Convertir esto en repo listo

🔹 Añadir cooldowns

🔹 Añadir comandos tipo !ark olvidar

🔹 Añadir sistema de niveles personalizados

Dime cómo quieres seguir 👌