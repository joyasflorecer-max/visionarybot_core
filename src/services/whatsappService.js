const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const iniciarWhatsApp = async (handleMessage) => {
    console.log("🚀 Iniciando servicio de WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState('sesion_auth_visionaria');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('⚡ ESCANEA EL QR ⚡');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            if (shouldReconnect) iniciarWhatsApp(handleMessage);
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Conectado y Listo 🟢');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ✅ Captura robusta de mensajes
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const texto =
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                null;

            if (!texto) {
                console.log('📩 Mensaje no texto recibido, lo ignoro.');
                continue;
            }

            console.log(`📩 ${msg.key.remoteJid}: ${texto}`);

            // ✅ Procesar el mensaje
            await handleMessage(msg, sock);
        }
    });
};

module.exports = { iniciarWhatsApp };
