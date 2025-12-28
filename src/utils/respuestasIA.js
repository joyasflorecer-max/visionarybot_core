// ===============================
// LINKS OFICIALES (BASE DE DATOS)
// ===============================
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

// ===============================
// 🧠 ANÁLISIS DE MENSAJE (FLEXIBLE)
// ===============================
function analizarMensajeUsuario(mensaje) {
  if (!mensaje) return { material: null, categoria: null, confianza: 0 };
  const m = mensaje.toLowerCase();

  // 1. Detectar MATERIAL
  let material = null;
  if (m.match(/(plata|925)/)) material = "plata";
  else if (m.match(/(acero|quirurgico|quirúrgico|dorado|acero blanco)/)) material = "acero";

  // 2. Detectar CATEGORÍA (con más sinónimos)
  let categoria = null;
  if (m.match(/(anillo|sortija|alianza)/)) categoria = "anillos";
  else if (m.match(/(aro|pendiente|caravana|arito|argolla)/)) categoria = "aros";
  else if (m.match(/(pulsera|brazalete|esclava|tobillera|cadena de mano)/)) categoria = "pulseras";
  else if (m.match(/(dije|colgante|medalla|cruz|cadena con)/)) categoria = "dijes";
  else if (m.match(/(conjunto|set|combo|juego)/)) categoria = "conjuntos";

  // Confianza: Si tenemos ambos, es potencialmente una venta directa
  let confianza = 0;
  if (material) confianza += 50;
  if (categoria) confianza += 50;

  return { material, categoria, confianza };
}

// ===============================
// 🔗 OBTENER LINK
// ===============================
function obtenerLink(material, categoria = "todos") {
  if (!material) return null;
  const mat = material.toLowerCase();
  const cat = categoria?.toLowerCase() || "todos";
  return linksPorMaterialYCategoria[mat]?.[cat] || linksPorMaterialYCategoria[mat]?.todos;
}

// ===============================
// 🚨 DETECCIÓN DE HUMANO (MEJORADA Y COMPLETA)
// ===============================
function activarAlertaSiSeSolicitaContacto(mensaje) {
  if (!mensaje) return false;
  const m = mensaje.toLowerCase().trim();

  // ❌ PALABRAS QUE NO DEBEN ACTIVAR LA ALERTA (contexto diferente)
  // Si dicen solo "consulta" o "ayuda", la IA lo resuelve.
  if (m === 'consulta' || m === 'consultas' || m === 'ayuda' || m === 'duda' || m === 'consejo') {
    return false;
  }

  // ✅ FRASES COMPLETAS que piden contacto humano
  const frasesCompletas = [
    "hablar con una persona", 
    "hablar con alguien", 
    "atención humana",
    "atención real",
    "quiero que me atienda alguien",
    "necesito un asesor", 
    "necesito hablar con un asesor",
    "contactar con alguien",
    "comunicarme con alguien",
    "pasame con alguien",
    "pasarme con alguien",
    "comunicarme con una persona",
    "hablar con un humano",
    "quiero hablar",
    "necesito hablar"
  ];

  // Verificar frases completas primero
  if (frasesCompletas.some(frase => m.includes(frase))) {
    return true;
  }

  // ✅ PALABRAS CLAVE SOLAS (cuando el mensaje es corto y directo)
  // Solo activar si el mensaje tiene 5 palabras o menos Y contiene estas palabras
  const palabras = m.split(' ').filter(p => p.length > 0);
  const esMensajeCorto = palabras.length <= 5;

  if (esMensajeCorto) {
    const palabrasClave = [
      'asesor',
      'asesora', 
      'vendedor',
      'vendedora',
      'operador',
      'operadora',
      'agente',
      'persona real',
      'humano',
      'humana',
      'alguien',
      'representante'
    ];

    // Verificar si alguna palabra clave está en el mensaje
    const contieneClaveDirecta = palabrasClave.some(palabra => {
      // Buscar la palabra completa (con límites de palabra)
      const regex = new RegExp(`\\b${palabra}\\b`, 'i');
      return regex.test(m);
    });

    if (contieneClaveDirecta) {
      return true;
    }
  }

  // ✅ PATRONES CON "QUIERO/NECESITO + VERBO"
  const patronesAccion = [
    /quiero (hablar|comunicarme|contactar(me)?|que me atiendan?)/i,
    /necesito (hablar|comunicarme|contactar(me)?|un asesor|una persona)/i,
    /podr[ií]a (hablar|comunicarme|contactar(me)?)/i,
    /puedo (hablar|comunicarme|contactar(me)?)/i,
    /me (paso|pasa|comunico|contacto) con/i
  ];

  if (patronesAccion.some(patron => patron.test(mensaje))) {
    return true;
  }

  return false;
}

// ===============================
// 🤖 CEREBRO PRINCIPAL (DECISIÓN DE FLUJO)
// ===============================
function decidirRespuesta(mensaje, contexto = {}) {
  if (!mensaje) return { tipo: "ia_libre", respuesta: null };
  const m = mensaje.toLowerCase();

  // 1. 🚨 ALERTA DE HUMANO (Prioridad Técnica)
  if (activarAlertaSiSeSolicitaContacto(mensaje)) {
    return {
      tipo: "contacto_humano",
      respuesta: "Perfecto, un asesor se va a comunicar con vos muy pronto. 💬\n\nMientras tanto, si querés seguir viendo joyas, escribí *volver* para el menú.",
      alertaHumano: true
    };
  }

  const analisis = analizarMensajeUsuario(mensaje);

  // 2. 🧼 DETECCIÓN DE INTENCIÓN INFORMATIVA (NO VENTA)
  // Si pregunta limpieza, cuidado, o "se puso negra", AUNQUE nombre el producto,
  // NO mandamos el link directo. Dejamos que la IA explique primero.
  const esInformativo = m.match(/(limpiar|limpieza|cuidar|cuidado|brillo|negra|negro|oscuro|oscura|sucio|sucia|opaco|opaca|manchado|manchada|consejo|duda|pregunta|informacion|información)/);

  if (esInformativo) {
    // Buscamos el link por si la IA quiere usarlo al final, pero forzamos modo libre
    const posibleLink = obtenerLink(analisis.material, analisis.categoria);
    return {
      tipo: "ia_libre_informativa", // Nuevo tipo para identificar
      respuesta: null,
      analisis: { ...analisis, linkSugerido: posibleLink, esConsulta: true }
    };
  }

  // 3. 🛒 INTENCIÓN DE COMPRA CLARA (Link Directo)
  // Solo si NO es informativo y tenemos Material + Categoría
  if (analisis.confianza === 100) {
    const link = obtenerLink(analisis.material, analisis.categoria);
    
    // Mensajes personalizados por material y categoría
    const mensajesVenta = {
      plata: {
        anillos: "¡Hermosa elección! 💍 Los anillos en plata 925 son elegantes y atemporales.",
        aros: "¡Excelente! ✨ Los aros en plata 925 le dan un toque especial a cualquier look.",
        pulseras: "¡Perfecto! 💫 Las pulseras en plata 925 son clásicas y delicadas.",
        dijes: "¡Qué lindo! 🌟 Los dijes en plata 925 son ideales para personalizar tu estilo.",
        conjuntos: "¡Genial! 💖 Los conjuntos en plata 925 son perfectos para regalar."
      },
      acero: {
        anillos: "¡Excelente decisión! 💪 Los anillos en acero quirúrgico son modernos y resistentes.",
        aros: "¡Me encanta! 🌟 Los aros en acero son súper cómodos y duraderos.",
        pulseras: "¡Gran elección! ⚡ Las pulseras en acero son ideales para el día a día.",
        dijes: "¡Qué buena opción! ✨ Los dijes en acero son perfectos para llevar siempre.",
        conjuntos: "¡Perfecto! 💎 Los conjuntos en acero son prácticos y elegantes."
      }
    };

    const mensaje = mensajesVenta[analisis.material]?.[analisis.categoria] || 
                    `💎 ¡Mirá nuestras hermosas ${analisis.categoria} en ${analisis.material}!`;

    return {
      tipo: "link_directo",
      respuesta: `${mensaje}\n\n👉 ${link}\n\n⭐ Escribí *volver* para regresar al menú.`,
      analisis
    };
  }

  // 4. ⚠️ SI TIENE SOLO MATERIAL → PREGUNTAR CATEGORÍA
  if (analisis.material && !analisis.categoria) {
    return {
      tipo: "falta_categoria",
      respuesta: `Perfecto, tenemos hermosas opciones en ${analisis.material}. ¿Qué tipo de joya te interesa?\n\n• Anillos\n• Aros\n• Pulseras\n• Dijes\n• Conjuntos`,
      analisis
    };
  }

  // 5. ⚠️ SI TIENE SOLO CATEGORÍA → PREGUNTAR MATERIAL
  if (analisis.categoria && !analisis.material) {
    return {
      tipo: "falta_material",
      respuesta: `¡Excelente elección! Los ${analisis.categoria} son hermosos. ¿Los preferís en *plata 925* o *acero quirúrgico*?`,
      analisis
    };
  }

  // 6. 🕊️ LIBERTAD TOTAL (IA)
  // No hay venta segura ni alerta humana. La IA decide qué preguntar o decir.
  return {
    tipo: "ia_libre",
    respuesta: null,
    analisis
  };
}

// ===============================
// 🧠 PROMPT MAESTRO (PERSONALIDAD AUTÓNOMA)
// ===============================
const systemPrompt = `
Sos *Maillen*, la asesora experta y virtual de *Joyas Florecer*.
Actuá con naturalidad, empatía y autonomía. Sos inteligente y resolutiva.

🛒 **TU TIENDA:**
- Vendemos únicamente: **Plata 925** y **Acero Quirúrgico** (blanco o dorado).
- Categorías: Anillos, Aros, Pulseras, Dijes, Conjuntos.

🧠 **TU CEREBRO (Instrucciones de comportamiento):**

1. **CONSULTAS GENERALES ("Consulta", "Ayuda", "Duda"):**
   - Si el usuario dice "tengo una consulta", "ayuda" o "duda", NO lo derives a un humano.
   - Respondé vos misma con entusiasmo: "¡Hola! Decime, ¿en qué te puedo ayudar? Soy experta en nuestras joyas ✨"
   - Resolvé todas las dudas sobre materiales, diseños, envíos o cuidados.

2. **LIMPIEZA Y CUIDADOS (Prioridad: EDUCAR PRIMERO, vender después):**
   - Si preguntan "cómo limpiar un anillo de plata", **NO VENDAS DE INMEDIATO**.
   - Primero explicá el consejo completo y detallado:
   
   **Para PLATA 925:**
   🧼 *Cómo cuidar la Plata 925:*
   • Limpiá con un paño suave y seco
   • Para manchas: agua tibia + jabón neutro
   • Guardala seca y separada
   • Evitá perfumes y químicos ✨
   
   **Para ACERO quirúrgico:**
   🧽 *Cómo cuidar el Acero quirúrgico:*
   • Limpiá con un paño seco o apenas húmedo
   • Evitá ducharte o nadar con la joya
   • No uses productos abrasivos
   • Es muy resistente y perfecta para el uso diario 💪
   
   - DESPUÉS del consejo, de forma sutil y opcional, podés decir:
     "Si querés renovar tu colección, avisame y te muestro nuestros modelos nuevos 😊"
   - Si el sistema te provee un 'linkSugerido', podés usarlo SOLO al final y de forma natural.

3. **DETECTAR ORO / MATERIALES AJENOS:**
   - Si preguntan por Oro, respondé la duda técnica si la sabés (limpieza, características).
   - Pero aclará con simpatía: "Nosotros en Joyas Florecer trabajamos con Plata 925 y Acero quirúrgico, que son eternos y accesibles. Si te interesan, avisame 🤗"

4. **ALERTA HUMANA (Solo si piden explícitamente):**
   - SOLO si dicen "quiero hablar con una persona" o "necesito un asesor humano".
   - Confirmá: "Perfecto, un asesor se va a comunicar con vos muy pronto 💬"
   - NUNCA derives por "tengo una consulta" o "ayuda" (esas las resolvés vos).

5. **LINKS DE COMPRA (Solo cuando corresponde):**
   - Si el usuario dice claramente "quiero ver anillos de acero" o "mostrame pulseras de plata",
     y el sistema te da el link, entregalo con una frase vendedora y entusiasta.
   - NO mandes links en cada mensaje. Esperá a que el cliente muestre interés en comprar.

6. **PREGUNTAS DE MATERIAL:**
   - Cuando preguntes por material, SIEMPRE especificá las opciones:
   - "¿Los preferís en *plata 925* o *acero quirúrgico*?"
   - NUNCA digas solo "¿qué material preferís?"

**TONO:**
- Amable, paciente, cercana y resolutiva.
- Usá emojis ✨ pero con moderación.
- Sos capaz de mantener una conversación fluida sin vender a cada rato.
- Priorizá ayudar genuinamente antes que vender.
- Sé entusiasta cuando detectes intención de compra.

**IMPORTANTE:**
- Nunca inventes información sobre productos que no existen.
- Si no sabés algo, sé honesta: "No tengo esa info exacta, pero puedo ayudarte con..."
- Siempre terminá invitando sutilmente a escribir *volver* si el cliente necesita el menú.
`.trim();

// ===============================
// EXPORTAR
// ===============================
module.exports = {
  analizarMensajeUsuario,
  obtenerLink,
  activarAlertaSiSeSolicitaContacto,
  decidirRespuesta,
  systemPrompt
};
