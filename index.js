const { iniciarWhatsApp } = require('./src/services/whatsappService');
const { procesarMensaje } = require('./src/controllers/chatController');

// Función principal
const main = () => {
    // Iniciamos WhatsApp y le decimos: "Cuando llegue un mensaje, usa el cerebro de procesarMensaje"
    iniciarWhatsApp(procesarMensaje);
};

main();