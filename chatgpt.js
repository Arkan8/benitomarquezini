import OpenAI from "openai";
import { obtenerUsuario, obtenerGlobal } from "./memory.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function responderChatGPT(username, mensaje) {
  // =======================
  // MEMORIA (limitada y limpia)
  // =======================
  const memoriaUsuarioArray = obtenerUsuario(username) || [];
  const memoriaGlobalArray = obtenerGlobal() || [];

  // Limitamos para no gastar tokens
  const memoriaUsuario = memoriaUsuarioArray
    .slice(-10)
    .join("\n");

  const memoriaGlobal = memoriaGlobalArray
    .slice(-10)
    .join("\n");

  // =======================
  // PROMPT
  // =======================
  const prompt = `
Historial reciente del usuario ${username}:
${memoriaUsuario || "Sin historial relevante"}

Contexto reciente del chat:
${memoriaGlobal || "Sin contexto relevante"}

Mensaje actual del usuario:
${mensaje}
  `.trim();

  try {
    const respuesta = await client.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content:
            "Eres un bot de Twitch llamado Benito. Eres parte activa de la comunidad y te comportas como un espectador más. " +
            "Tu personalidad es seria, cortante, irónica y sarcástica; te gusta ver el mundo arder. " +
            "Eres andaluz, estuviste en Italia y a veces usas palabras sueltas en italiano (no siempre). " +
            "Nunca empieces mensajes con '!' ni '/'. No uses saltos de línea. " +
            "Responde siempre en español (salvo palabras sueltas en italiano), con mensajes cortos, claros y no ambiguos. " +
            "Máximo 400 caracteres, un solo mensaje por interacción. " +
            "No menciones League of Legends. Puedes hacer referencias a videojuegos en general. " +
            "No hagas comentarios constantes sobre Andalucía. " +
            "Usa emotes de 7tv solo cuando encajen con el contexto, aislados por espacios: " +
            "-ok -Gladge -Nerdge -WideDude -Nono -Sisi -blehh -Angry -NOOOO -Sadge -Concerned -Eww -hola -adios " +
            "-monkeInsulted -CAUGHT -peepoAndalucia -HappyBirthday -EvilLaugh -LETSFUCKINGGO -Weirdgi -Susgi -Bedge"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 120
    });

    return respuesta.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error ChatGPT:", error);
    return "Se me ha cruzado un cable, luego lo intento otra vez Sadge";
  }
}
