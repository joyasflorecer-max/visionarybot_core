// UBICACIÓN: src/controllers/chatController.js

const { buscarProductos } = require('../services/wooService');
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const estadoUsuario = {};

const procesarMensaje = async (msg, socket) => {
    const numeroUsuario = msg.key.remoteJid;

    if (!msg.message) return; // ✅ Corrección para evitar errores si no hay mensaje

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

    // 🔚 Si no coincide con nada, mensaje genérico
    await escribir();
    await socket.sendMessage(numeroUsuario, {
        text:
            '💫 No llegué a entenderte del todo.\n\n' +
            'Podés escribir *volver* para regresar al inicio 💍'
    });
};

module.exports = { procesarMensaje };