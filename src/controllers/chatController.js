// UBICACIÓN: src/controllers/chatController.js

const { buscarProductos } = require('../services/wooService');
const OpenAI = require('openai');

// ✅ ÚNICA CORRECCIÓN: importar config correctamente
const config = require('../config/config');

const {
    systemPrompt,
    generarConsejoCuidado,
    activarAlertaSiSeSolicitaContacto,
    obtenerLink,
    decidirRespuesta,
} = require('../utils/respuestasIA');

// ✅ ÚNICA CORRECCIÓN: usar la API key desde config
const openai = new OpenAI({
    apiKey: config.openai.apiKey,
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const estadoUsuario = {};

const procesarMensaje = async (msg, socket) => {
    const numeroUsuario = msg.key.remoteJid;
    const textoUsuario = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''
    ).trim().toLowerCase();

    console.log(`📩 ${numeroUsuario}: ${textoUsuario}`);

    const escribir = async (ms = 2000) => {
        await socket.sendPresenceUpdate('composing', numeroUsuario);
        await delay(ms);
        await socket.sendPresenceUpdate('paused', numeroUsuario);
    };

    const palabrasSaludo = [
        'hola', 'buenos días', 'buen dia', 'buenas tardes', 'buenas noches', 'buenas', 'buenos'
    ];

    if (palabrasSaludo.some(p => textoUsuario.includes(p))) {
        await escribir(1500);
        await socket.sendMessage(numeroUsuario, {
            text:
                '👋 ¡Hola! Soy *Maillen*, tu asesora de *Joyas Florecer* 💍✨\n\n' +
                'Estoy acá para ayudarte a encontrar la joya perfecta 💖\n\n' +
                '¿Qué te gustaría hacer?\n\n' +
                '*1️⃣* 💎 Ver el *CATÁLOGO*\n' +
                '*2️⃣* 💬 Consultar *INFO / ASESORAMIENTO*\n'
        });
        return;
    }

    if (textoUsuario === '1' || textoUsuario.includes('catalogo') || textoUsuario.includes('ver las joyas')) {
        await escribir();
        await socket.sendMessage(numeroUsuario, {
            text:
                '✨ ¡Hermosa elección!\n\n' +
                '¿Qué material te gustaría ver?\n\n' +
                '🥈 *Plata 925*\n' +
                '⛓️ *Acero quirúrgico*\n\n' +
                '✍️ Escribí *plata* o *acero*\n\n' +
                '⭐ Escribí *volver* para regresar al inicio'
        });
        return;
    }

    if (textoUsuario === '2' || textoUsuario.includes('info') || textoUsuario.includes('consulta')) {
        await escribir();
        await socket.sendMessage(numeroUsuario, {
            text:
                '💬 ¡Perfecto! 😊\n\n' +
                'En breve una persona real se va a comunicar con vos para ayudarte mejor 🤍\n\n' +
                '⭐ Mientras tanto podés escribir *volver* para regresar al inicio'
        });

        try {
            const numeroAdmin = process.env.NUMERO_ADMIN?.trim();
            const numeroAdminFormatoWA = numeroAdmin ? `${numeroAdmin}@s.whatsapp.net` : null;
            const numeroLimpio = numeroUsuario.split('@')[0];
            const nombreCliente = msg.pushName || 'Cliente sin nombre';

            if (numeroAdminFormatoWA) {
                await socket.sendMessage(numeroAdminFormatoWA, {
                    text:
                        '🚨 *ALERTA DE CONSULTA* 🚨\n\n' +
                        `🙋‍♀️ *Perfil:* ${nombreCliente}\n` +
                        `📱 *Contacto:* @${numeroLimpio}\n` +
                        `💬 *Mensaje:* "${textoUsuario}"\n\n` +
                        '👆 *Tocá el nombre azul para abrir el chat*',
                    mentions: [numeroUsuario]
                });
            }
        } catch (error) {
            console.error('❌ Error al enviar alerta al admin:', error);
        }

        return;
    }

    if (textoUsuario === 'plata' || textoUsuario === 'acero') {
        estadoUsuario[numeroUsuario] = textoUsuario;

        const textoMaterial = textoUsuario === 'plata'
            ? '🥈 La *Plata 925* es delicada, luminosa y eterna ✨'
            : '⛓️ El *Acero quirúrgico* es moderno y resistente 💪';

        await escribir();
        await socket.sendMessage(numeroUsuario, {
            text:
                `${textoMaterial}\n\n` +
                '¿Qué tipo de joya te gustaría ver?\n\n' +
                '💍 Anillos\n' +
                '👂 Aros\n' +
                '🤍 Pulseras\n' +
                '✨ Dijes\n' +
                '🎁 Conjuntos\n\n' +
                '⭐ Escribí *volver* para regresar al inicio'
        });
        return;
    }

    // ========================= IA =========================

    try {
        await escribir(1800);

        const decision = decidirRespuesta(textoUsuario);

        if (decision.respuesta) {
            await socket.sendMessage(numeroUsuario, {
                text: `${decision.respuesta}\n\n⭐ Escribí *volver* para ver el menú`
            });
            return;
        }

        const respuesta = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: textoUsuario }
            ],
        });

        await socket.sendMessage(numeroUsuario, {
            text: `${respuesta.choices[0].message.content}\n\n⭐ Escribí *volver* para ver el menú`
        });

    } catch (error) {
        console.error('❌ Error IA:', error);
        await socket.sendMessage(numeroUsuario, {
            text:
                '💫 No llegué a entenderte del todo.\n\n' +
                'Podés escribir *volver* para regresar al inicio 💍'
        });
    }
};

module.exports = { procesarMensaje };
