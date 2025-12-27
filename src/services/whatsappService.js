const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const iniciarWhatsApp = async (handleMessage) => {
    console.log("🚀 Iniciando servicio de WhatsApp...");
    // Intentamos usar la sesión guardada (si borraste la carpeta, pedirá QR)
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
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) iniciarWhatsApp(handleMessage);
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Conectado y Listo 🟢');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        handleMessage(msg, sock);
    });
};

// ESTA LÍNEA PERMITE QUE EL INDEX.JS LA ENCUENTRE Y NO DÉ ERROR
module.exports = { iniciarWhatsApp };
