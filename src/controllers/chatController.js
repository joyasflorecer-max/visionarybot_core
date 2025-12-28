// UBICACIÓN: src/controllers/chatController.js

const { buscarProductos } = require('../services/wooService');
const OpenAI = require('openai');

// ✅ CORRECCIÓN 1: La ruta correcta es ../config (sin repetir /config)
const config = require('../config');

// ✅ CORRECCIÓN 2: Importamos las funciones del archivo que acabamos de arreglar
const {
    systemPrompt,
    decidirRespuesta,
} = require('../utils/respuestasIA');

const openai = new OpenAI({
    apiKey: config.openai.apiKey, // Usamos la config segura
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const procesarMensaje = async (msg, socket) => {
    try {
        const numeroUsuario = msg.key.remoteJid;
        const textoUsuario = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();

        if (!textoUsuario) return;
        console.log(`📩 ${numeroUsuario}: ${textoUsuario}`);

        const escribir = async (ms = 1500) => {
            await socket.sendPresenceUpdate('composing', numeroUsuario);
            await delay(ms);
            await socket.sendPresenceUpdate('paused', numeroUsuario);
        };

        // 1. Saludo
        const palabrasSaludo = ['hola', 'buen dia', 'buenas'];
        if (palabrasSaludo.some(s => textoUsuario.toLowerCase().includes(s)) && textoUsuario.length < 20) {
            await escribir();
            await socket.sendMessage(numeroUsuario, { text: '¡Hola! 👋 Bienvenido a Joyas Florecer. Soy Maillen. ¿En qué puedo ayudarte hoy? ✨' });
            return;
        }

        // 2. Cerebro
        await escribir();
        const decision = decidirRespuesta(textoUsuario);

        // 3. Respuesta Directa (Link o Humano)
        if (decision.respuesta) {
            await socket.sendMessage(numeroUsuario, { text: decision.respuesta });
            return;
        }

        // 4. IA (Conversación)
        let prompt = systemPrompt;
        if (decision.analisis?.linkSugerido) {
            prompt += `\n[SISTEMA]: Si hay intención de compra, sugerí este link: ${decision.analisis.linkSugerido}`;
        }

        const gpt = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: textoUsuario }],
            temperature: 0.7
        });

        await socket.sendMessage(numeroUsuario, { text: gpt.choices[0].message.content });

    } catch (error) {
        console.error('❌ Error:', error);
    }
};

module.exports = { procesarMensaje };