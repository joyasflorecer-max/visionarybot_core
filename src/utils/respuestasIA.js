// UBICACIÓN: src/utils/respuestasIA.js

const linksPorMaterialYCategoria = {
  plata: {
    todos: "https://joyasflorecer.com.ar/?b_pa_material=23",
    anillos: "https://joyasflorecer.com.ar/?b_product_cat=17&b_pa_material=23",
    aros: "https://joyasflorecer.com.ar/?b_product_cat=20&b_pa_material=23",
    pulseras: "https://joyasflorecer.com.ar/?b_product_cat=18&b_pa_material=23",
    dijes: "https://joyasflorecer.com.ar/?b_product_cat=22&b_pa_material=23",
    conjuntos: "https://joyasflorecer.com.ar/?b_product_cat=21&b_pa_material=23",
  },
  acero: {
    todos: "https://joyasflorecer.com.ar/?b_pa_material=24",
    anillos: "https://joyasflorecer.com.ar/?b_product_cat=17&b_pa_material=24",
    aros: "https://joyasflorecer.com.ar/?b_product_cat=20&b_pa_material=24",
    pulseras: "https://joyasflorecer.com.ar/?b_product_cat=18&b_pa_material=24",
    dijes: "https://joyasflorecer.com.ar/?b_product_cat=22&b_pa_material=24",
    conjuntos: "https://joyasflorecer.com.ar/?b_product_cat=21&b_pa_material=24",
  },
};

function analizarMensajeUsuario(mensaje) {
  if (!mensaje) return { material: null, categoria: null, confianza: 0 };
  const m = mensaje.toLowerCase();

  let material = null;
  if (m.match(/(plata|925)/)) material = "plata";
  else if (m.match(/(acero|quirurgico|quirúrgico|dorado)/)) material = "acero";

  let categoria = null;
  if (m.match(/(anillo|sortija|alianza)/)) categoria = "anillos";
  else if (m.match(/(aro|pendiente|caravana|arito)/)) categoria = "aros";
  else if (m.match(/(pulsera|brazalete|esclava|tobillera)/)) categoria = "pulseras";
  else if (m.match(/(dije|colgante|medalla|cruz)/)) categoria = "dijes";
  else if (m.match(/(conjunto|set|combo)/)) categoria = "conjuntos";

  let confianza = 0;
  if (material) confianza += 50;
  if (categoria) confianza += 50;

  return { material, categoria, confianza };
}

function obtenerLink(material, categoria = "todos") {
  if (!material) return null;
  const mat = material.toLowerCase();
  const cat = categoria?.toLowerCase() || "todos";
  return linksPorMaterialYCategoria[mat]?.[cat] || linksPorMaterialYCategoria[mat]?.todos;
}

function activarAlertaSiSeSolicitaContacto(mensaje) {
  if (!mensaje) return false;
  const m = mensaje.toLowerCase();
  if (m.includes('consulta') || m.includes('ayuda') || m.includes('duda')) return false;

  const triggers = [
    "hablar con una persona", "hablar con alguien", "atención humana",
    "quiero que me atienda alguien", "necesito un asesor", "contactar con alguien",
    "pasame con alguien", "comunicarme con una persona"
  ];
  return triggers.some(t => m.includes(t));
}

function decidirRespuesta(mensaje) {
  if (!mensaje) return { tipo: "ia_libre", respuesta: null };
  
  // 1. Alerta Humana
  if (activarAlertaSiSeSolicitaContacto(mensaje)) {
    return { tipo: "contacto_humano", respuesta: null, alertaHumano: true };
  }

  const analisis = analizarMensajeUsuario(mensaje);

  // 2. Informativo (frenar venta)
  const m = mensaje.toLowerCase();
  if (m.match(/(limpiar|limpieza|cuidar|cuidado|brillo|negra|oscuro|sucio|consejo|consulta|duda|ayuda)/)) {
    const posibleLink = obtenerLink(analisis.material, analisis.categoria);
    return { tipo: "ia_libre", respuesta: null, analisis: { ...analisis, linkSugerido: posibleLink } };
  }

  // 3. Venta Directa
  if (analisis.confianza === 100) {
    const link = obtenerLink(analisis.material, analisis.categoria);
    return {
      tipo: "link_encontrado",
      datos: { ...analisis, link },
      respuesta: `(Sistema: El usuario quiere comprar explícitamente ${analisis.categoria} de ${analisis.material}. Entregá este link: ${link})`
    };
  }

  return { tipo: "ia_libre", respuesta: null, analisis };
}

const systemPrompt = `
Sos Maillen, asesora de Joyas Florecer.
Objetivo: Guiar la venta con naturalidad.
1. CONSULTAS: Respondé vos misma.
2. LIMPIEZA: Da el tip casero primero.
3. HUMANO: Solo si lo piden explícitamente.
4. LINK: Si tenés link, entregalo con frase vendedora.
`.trim();

module.exports = {
  analizarMensajeUsuario,
  obtenerLink,
  activarAlertaSiSeSolicitaContacto,
  decidirRespuesta,
  systemPrompt
}; 
// ⬆️ ¡ESTA LLAVE Y PUNTO Y COMA SON CRUCIALES!