// UBICACIÓN: src/config.js
require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

// ============================================================
// 1. VERIFICACIÓN DE SEGURIDAD (Para evitar errores en logs)
// ============================================================
if (!process.env.WOO_STORE_URL) {
  console.error("⚠️ ADVERTENCIA: Falta WOO_STORE_URL en .env, usando valor por defecto.");
}
// Aseguramos que la URL tenga valor (usa la variable o el link fijo por seguridad)
const SITE_URL = process.env.WOO_STORE_URL || "https://joyasflorecer.com.ar";

// ============================================================
// 2. INICIALIZAR CONEXIÓN A WOOCOMMERCE
// ============================================================
const WooCommerce = new WooCommerceRestApi({
  url: SITE_URL, 
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: "wc/v3"
});

// ============================================================
// 3. EXPORTAR CONFIGURACIÓN COMPLETA
// ============================================================
module.exports = {
  // Claves de WhatsApp y Admin
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneId: process.env.PHONE_ID_WHATSAPP, 
    adminNumber: process.env.NUMERO_ADMIN 
  },
  
  // Claves de OpenAI
  openai: {
    apiKey: process.env.OPENAI_KEY
  },

  // Config de la Tienda (IDs y URLs)
  store: {
    baseUrl: SITE_URL,
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
  },

  // Exportamos también la conexión lista para usar
  woo: WooCommerce
};