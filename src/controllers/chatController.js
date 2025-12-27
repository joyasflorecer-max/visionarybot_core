// UBICACIÓN: src/controllers/chatController.js

const { buscarProductos } = require('../services/wooService');
const OpenAI = require('openai');
const {
    systemPrompt,
    generarConsejoCuidado,
    activarAlertaSiSeSolicitaContacto,
    obtenerLink,
    decidirRespuesta, // ✅ AGREGAR ESTA IMPORTACIÓN
} = require('../utils/respuestasIA');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
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

    const categorias = {
        anillo: { id: 17, nombre: 'Anillos' },
        aro: { id: 20, nombre: 'Aros' },
        pulsera: { id: 18, nombre: 'Pulseras' },
        dije: { id: 22, nombre: 'Dijes' },
        conjunto: { id: 21, nombre: 'Conjuntos' }
    };

    const clavesCategorias = Object.keys(categorias).sort((a, b) => b.length - a.length);
    let categoriaDetectada = null;

    for (const clave of clavesCategorias) {
        const re = new RegExp(`\\b${clave}(?:s)?\\b`, 'i');
        if (re.test(textoUsuario)) {
            categoriaDetectada = clave;
            break;
        }
    }

    if (categoriaDetectada) {
        await escribir(800);

        const materialGuardado = (estadoUsuario[numeroUsuario] || 'plata').toLowerCase();
        const materialId = materialGuardado === 'acero' ? 24 : 23;
        const materialTexto = materialId === 23 ? 'Plata 925 🥈' : 'Acero quirúrgico ⛓️';

        const { id: categoriaId, nombre } = categorias[categoriaDetectada];

        const linkCatalogo =
            `https://joyasflorecer.com.ar/?b_product_cat=${categoriaId}&b_pa_material=${materialId}`;

        const mensaje =
            `✨ *${nombre} en ${materialTexto}* ✨\n\n` +
            'Acá podés ver *todo el catálogo disponible*:\n\n' +
            `${linkCatalogo}\n\n` +
            '⭐ Escribí *volver* para regresar al inicio\n' +
            '💖 O escribime si querés ayuda para elegir';

        try {
            const productos = await buscarProductos(
                materialGuardado === 'plata' ? 'Plata' : 'Acero',
                categoriaDetectada
            );

            const imagenURL = productos?.[0]?.images?.[0]?.src;

            if (imagenURL) {
                await socket.sendMessage(numeroUsuario, {
                    image: { url: imagenURL },
                    caption: mensaje
                });
            } else {
                await socket.sendMessage(numeroUsuario, { text: mensaje });
            }
        } catch {
            await socket.sendMessage(numeroUsuario, { text: mensaje });
        }

        return;
    }

    if (textoUsuario === 'volver' || textoUsuario === 'inicio') {
        await escribir();
        await socket.sendMessage(numeroUsuario, {
            text:
                '🔁 Volvemos al inicio 😊\n\n' +
                '*1️⃣* 💎 Ver el *CATÁLOGO*\n' +
                '*2️⃣* 💬 Consultar *INFO / ASESORAMIENTO*'
        });
        return;
    }

    // ====================================================================
    // 🔥 AQUÍ ESTÁ EL CAMBIO PRINCIPAL - USAR decidirRespuesta() PRIMERO
    // ====================================================================
    try {
        await escribir(1800);

        // ✅ PASO 1: Ejecutar la lógica inteligente ANTES de OpenAI
        const decision = decidirRespuesta(textoUsuario);

        // ✅ PASO 2: Si detecta contacto humano, enviar alerta
        if (decision.tipo === 'contacto_humano' || activarAlertaSiSeSolicitaContacto(textoUsuario)) {
            const numeroAdmin = process.env.NUMERO_ADMIN?.trim();
            const numeroAdminFormatoWA = numeroAdmin ? `${numeroAdmin}@s.whatsapp.net` : null;
            const numeroLimpio = numeroUsuario.split('@')[0];
            const nombreCliente = msg.pushName || 'Cliente sin nombre';

            if (numeroAdminFormatoWA) {
                await socket.sendMessage(numeroAdminFormatoWA, {
                    text:
                        '🚨 *ALERTA DE CONSULTA POR IA* 🚨\n\n' +
                        `🙋‍♀️ *Perfil:* ${nombreCliente}\n` +
                        `📱 *Contacto:* @${numeroLimpio}\n` +
                        `💬 *Mensaje:* "${textoUsuario}"\n\n` +
                        '👆 *Tocá el nombre azul para abrir el chat*',
                    mentions: [numeroUsuario]
                });
            }
        }

        // ✅ PASO 3: Si ya tiene respuesta directa (cuidado, regalo, etc.), enviarla SIN OpenAI
        if (decision.respuesta) {
            console.log('✅ Respuesta directa del sistema:', decision.tipo);
            
            await socket.sendMessage(numeroUsuario, {
                text: `${decision.respuesta}\n\n⭐ Escribí *volver* para ver el menú`
            });
            
            return; // ⚠️ IMPORTANTE: Salir aquí, NO llamar a OpenAI
        }

        // ✅ PASO 4: Si NO tiene respuesta directa, entonces SÍ llamar a OpenAI
        console.log('🤖 Llamando a OpenAI para conversación libre...');

        const respuesta = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: textoUsuario }
            ],
        });

        const textoIA = respuesta.choices[0].message.content;

        await socket.sendMessage(numeroUsuario, {
            text: `${textoIA}\n\n⭐ Escribí *volver* para ver el menú`
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