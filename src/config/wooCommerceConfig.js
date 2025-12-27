// Carga las variables del archivo .env inmediatamente
require('dotenv').config();

// Importa la librería que nos conecta con la tienda
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

// Inicializa el objeto de conexión
const api = new WooCommerceRestApi({
    url: process.env.WOO_STORE_URL, // Lee 'https://joyasflorecer.com.ar'
    consumerKey: process.env.WOO_CONSUMER_KEY, // Lee 'ck_...'
    consumerSecret: process.env.WOO_CONSUMER_SECRET, // Lee 'cs_...'
    version: "wc/v3", // Versión estándar de la API de WooCommerce
    queryStringAuth: true // Necesario para algunas configuraciones de hosting
});

module.exports = api;