// UBICACIÓN: src/config/config.js
require('dotenv').config();

module.exports = {
  // Claves de WhatsApp y Admin
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneId: process.env.PHONE_ID_WHATSAPP, // Asegúrate que en .env se llame así
    adminNumber: process.env.NUMERO_ADMIN // 5493834381638
  },
  // Claves de OpenAI
  openai: {
    apiKey: process.env.OPENAI_KEY
  },
  // Config de WooCommerce (Productos)
  store: {
    baseUrl: process.env.WOO_STORE_URL || "https://joyasflorecer.com.ar/",
    ids: {
      materiales: {
        plata: "23",
        acero: "24"
      },
      categorias: {
        anillos: "17",
        aros: "20",
        pulseras: "18",
        dijes: "22",
        conjuntos: "21"
      }
    }
  }
};