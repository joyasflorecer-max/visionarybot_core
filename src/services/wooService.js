const wooApi = require('../config/wooCommerceConfig');

// Función para obtener TODOS los productos disponibles
const obtenerCatalogoCompleto = async () => {
    try {
        const { data } = await wooApi.get("products", {
            per_page: 50, 
            status: 'publish', 
        });
        return data; 
    } catch (error) {
        console.error("❌ Error al obtener el catálogo de WooCommerce:", error.message);
        return []; 
    }
};

/**
 * Filtra el catálogo por palabras clave (ej: 'Plata' o 'Acero') y categoría (ej: 'Aros')
 */
const buscarProductos = async (material, categoria) => {
    const catalogo = await obtenerCatalogoCompleto();

    // Filtramos en JavaScript la lista que nos devolvió Woo
    const resultados = catalogo.filter(producto => {
        const nombre = producto.name.toLowerCase();
        
        // 1. Debe coincidir el material
        const tieneMaterial = nombre.includes(material.toLowerCase());

        // 2. Si se especificó una categoría, debe coincidir
        const tieneCategoria = !categoria || nombre.includes(categoria.toLowerCase());
        
        return tieneMaterial && tieneCategoria;
    });

    // Devolvemos solo los primeros 5 resultados para no saturar el chat
    return resultados.slice(0, 5);
};

module.exports = { obtenerCatalogoCompleto, buscarProductos };