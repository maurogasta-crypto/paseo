// ─────────────────────────────────────────────────────────────────────────────
// album.js — La forma del álbum del local y todo lo que se calcula de ella.
// Sello: album-1 (31-oct-2026)
//
// No toca el navegador ni Firebase: lo importan la portada (index.html), el
// editor (admin.html) y el banco (pruebas.mjs), que corre con `node` a secas.
// Si cambia la forma de un documento, cambia acá y en ningún otro lado.
//
// ── LA FORMA (albumes/<id> de pruebas-db555) ─────────────────────────────────
//   titulo, subtitulo, descripcion, contacto   textos de la portada
//   portada        id de un medio (la foto grande de arriba)
//   secciones      MAPA id → { nombre, orden, visible, descripcion,
//                               superficie (m²), estado, portada (id de medio) }
//   medios         MAPA id → { seccion, orden, tipo: "foto"|"video", url,
//                               titulo, detalle, creadoEn }
//   actualizadoEn, actualizadoPor
//
// Son MAPAS y no listas, y es la regla del ecosistema para lo que se edita
// desde más de un teléfono: cambiar un medio es escribir `medios.<id>`, y dos
// personas cargando fotos a la vez no se pisan. La primera versión (hasta el
// 31-oct) guardaba `secciones` como LISTA con los medios adentro, y cada
// cambio reescribía el álbum entero: lo que otro había subido en el medio se
// perdía sin aviso. `normalizar` lee las dos formas; el editor ofrece pasar
// la vieja a la nueva una vez, con copia en `_historial`.
//
// La miniatura NO se guarda: sale de la URL (`mini`). Un derivado guardado es
// un dato que se puede contradecir con su fuente.
// ─────────────────────────────────────────────────────────────────────────────

export const VERSION = "album-1";

/* La cuenta de Cloudinary del paseo. Público por diseño, igual que la config
   de Firebase: el nombre de la cuenta y un preset SIN firma no abren nada; el
   preset sólo deja subir. Lo que no venga de esta cuenta no se dibuja. */
export const CLOUDINARY = { cloud: "cwbnaivv", preset: "GeneralFlores" };
export const ALBUM_ID = "general-flores";

/* Techo del plan gratis de Cloudinary para un video. Una foto se achica en el
   teléfono a 2000 px antes de subir: entra en el cupo y se ve igual. */
export const VIDEO_MAX = 100 * 1024 * 1024;
export const FOTO_LADO = 2000;

export const ESTADOS = {
  "": "",
  disponible: "Disponible",
  reservado: "Reservado",
  alquilado: "Alquilado"
};

const PREFIJO = `https://res.cloudinary.com/${CLOUDINARY.cloud}/`;
export const esMedioNuestro = (url) => typeof url === "string" && url.startsWith(PREFIJO)
  && /\/(image|video)\/upload\//.test(url);

export function idNuevo(letra = "m", ahora = Date.now(), azar = Math.random) {
  return letra + ahora.toString(36) + Math.floor(azar() * 1e6).toString(36);
}

const txt = (v, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v) => (typeof v === "number" && isFinite(v) ? v : (typeof v === "string" && v.trim() !== "" && isFinite(Number(v)) ? Number(v) : null));

/* Lee un álbum de cualquiera de las dos formas y devuelve SIEMPRE la nueva.
   `vieja: true` dice que vino de la lista, para que el editor ofrezca pasarla. */
export function normalizar(d) {
  d = d || {};
  const out = {
    titulo: txt(d.titulo, 200), subtitulo: txt(d.subtitulo, 200),
    descripcion: txt(d.descripcion, 5000), contacto: txt(d.contacto, 500),
    portada: typeof d.portada === "string" ? d.portada : "",
    secciones: {}, medios: {}, vieja: false
  };
  if (Array.isArray(d.secciones)) {
    out.vieja = true;
    d.secciones.forEach((s, i) => {
      if (!s || !s.nombre) return;
      const sid = "s" + (i + 1);
      out.secciones[sid] = { nombre: txt(s.nombre, 120), orden: num(s.orden) ?? (i + 1) * 10,
        visible: s.visible !== false, descripcion: txt(s.descripcion), superficie: num(s.superficie),
        estado: ESTADOS[s.estado] !== undefined ? s.estado : "", portada: "" };
      (s.medios || []).forEach((m, j) => {
        if (!m || !esMedioNuestro(m.url)) return;
        out.medios[sid + "m" + (j + 1)] = { seccion: sid, orden: (j + 1) * 10,
          tipo: m.tipo === "video" ? "video" : "foto", url: m.url,
          titulo: txt(m.titulo, 120), detalle: txt(m.detalle), creadoEn: txt(m.creadoEn, 30) };
      });
    });
    if (typeof d.portadaUrl === "string" && esMedioNuestro(d.portadaUrl)) {
      const ya = Object.entries(out.medios).find(([, m]) => m.url === d.portadaUrl);
      if (ya) out.portada = ya[0];
      else {
        /* La portada vieja era una URL suelta, sin sección: entra como medio de
           una sección oculta para no perderla. */
        out.secciones.portada = { nombre: "Portada", orden: 0, visible: false, descripcion: "", superficie: null, estado: "", portada: "" };
        out.medios.portada1 = { seccion: "portada", orden: 10, tipo: "foto", url: d.portadaUrl, titulo: "Portada", detalle: "", creadoEn: "" };
        out.portada = "portada1";
      }
    }
    return out;
  }
  for (const [id, s] of Object.entries(d.secciones || {})) {
    if (!s || !s.nombre) continue;
    out.secciones[id] = { nombre: txt(s.nombre, 120), orden: num(s.orden) ?? 0, visible: s.visible !== false,
      descripcion: txt(s.descripcion), superficie: num(s.superficie),
      estado: ESTADOS[s.estado] !== undefined ? s.estado : "", portada: typeof s.portada === "string" ? s.portada : "" };
  }
  for (const [id, m] of Object.entries(d.medios || {})) {
    if (!m || !esMedioNuestro(m.url) || !out.secciones[m.seccion]) continue;
    out.medios[id] = { seccion: m.seccion, orden: num(m.orden) ?? 0, tipo: m.tipo === "video" ? "video" : "foto",
      url: m.url, titulo: txt(m.titulo, 120), detalle: txt(m.detalle), creadoEn: txt(m.creadoEn, 30) };
  }
  if (!out.medios[out.portada]) out.portada = "";
  return out;
}

/* Lo que se guarda al pasar de la forma vieja a la nueva (sin `vieja`). */
export function paraGuardar(a) {
  const { vieja, ...resto } = a;
  return resto;
}

export const secciones = (a, { soloVisibles = false } = {}) =>
  Object.entries(a.secciones || {}).map(([id, s]) => ({ id, ...s }))
    .filter((s) => !soloVisibles || s.visible)
    .sort((x, y) => (x.orden - y.orden) || x.nombre.localeCompare(y.nombre));

export const mediosDe = (a, seccion) =>
  Object.entries(a.medios || {}).map(([id, m]) => ({ id, ...m }))
    .filter((m) => m.seccion === seccion)
    .sort((x, y) => (x.orden - y.orden) || x.id.localeCompare(y.id));

/* La foto que representa una parte: la elegida, si sigue estando; si no, la
   primera foto; si no hay fotos, el primer video. Siempre con su `id`. */
export function portadaDe(a, seccion) {
  const s = a.secciones[seccion];
  if (s && s.portada && a.medios[s.portada] && a.medios[s.portada].seccion === seccion) return { id: s.portada, ...a.medios[s.portada] };
  const ms = mediosDe(a, seccion);
  return ms.find((m) => m.tipo === "foto") || ms[0] || null;
}

export function portadaDelAlbum(a) {
  if (a.portada && a.medios[a.portada]) return { id: a.portada, ...a.medios[a.portada] };
  for (const s of secciones(a, { soloVisibles: true })) { const p = portadaDe(a, s.id); if (p) return p; }
  return null;
}

/* El orden que toca para algo nuevo al final de una lista. */
export const ordenAlFinal = (items) => (items.length ? Math.max(...items.map((x) => x.orden || 0)) + 10 : 10);

/* Subir o bajar uno: devuelve los cambios de `orden` que hay que escribir
   ({ id: orden }), o null si ya está en la punta. Cambia SÓLO dos, y si dos
   tenían el mismo orden los separa: con un orden repetido el ▲ no movía nada. */
export function intercambiar(lista, id, paso) {
  const i = lista.findIndex((x) => x.id === id), j = i + paso;
  if (i < 0 || j < 0 || j >= lista.length) return null;
  const a = lista[i], b = lista[j];
  let oa = b.orden, ob = a.orden;
  if (oa === ob) { oa = paso < 0 ? ob - 1 : ob + 1; }
  return { [a.id]: oa, [b.id]: ob };
}

/* Las URLs que se muestran: Cloudinary transforma al vuelo, nada se guarda. */
export function mini(m, lado = 480) {
  if (!m || !esMedioNuestro(m.url)) return "";
  return m.tipo === "video"
    ? m.url.replace("/video/upload/", `/video/upload/so_1,w_${lado},h_${Math.round(lado * 0.75)},c_fill,q_auto/`).replace(/\.[a-z0-9]+$/i, ".jpg")
    : m.url.replace("/image/upload/", `/image/upload/w_${lado},h_${Math.round(lado * 0.75)},c_fill,q_auto,f_auto/`);
}
export function grande(m, lado = 1600) {
  if (!m || !esMedioNuestro(m.url)) return "";
  return m.tipo === "video"
    ? m.url.replace("/video/upload/", "/video/upload/q_auto/")
    : m.url.replace("/image/upload/", `/image/upload/w_${lado},c_limit,q_auto,f_auto/`);
}

/* Cuántas fotos y videos tiene una parte, para el resumen. */
export function cuenta(a, seccion) {
  const ms = seccion ? mediosDe(a, seccion) : Object.values(a.medios || {});
  return { fotos: ms.filter((m) => m.tipo === "foto").length, videos: ms.filter((m) => m.tipo === "video").length };
}

/* Valida un archivo ANTES de subirlo: si se va a rechazar, que sea acá y con
   la razón, no después de un minuto subiendo un video. */
export function problemaDelArchivo(f) {
  if (!f) return "no hay archivo";
  const video = /^video\//.test(f.type || ""), foto = /^image\//.test(f.type || "");
  if (!video && !foto) return `«${f.name}» no es una foto ni un video`;
  if (video && f.size > VIDEO_MAX) return `«${f.name}» pesa ${Math.round(f.size / 1048576)} MB: el plan gratis de Cloudinary acepta videos de hasta 100 MB`;
  return "";
}

/* El documento que llega por la API REST de Firestore viene con los tipos
   envueltos ({ stringValue: … }). La portada lee así, sin SDK. */
export function deFirestore(v) {
  if (v == null || typeof v !== "object") return v;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(deFirestore);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, deFirestore(x)]));
  return null;
}
export const documentoDeFirestore = (j) => deFirestore({ mapValue: { fields: (j && j.fields) || {} } });

export function superficieTexto(s) {
  return s && typeof s.superficie === "number" && s.superficie > 0 ? `${String(s.superficie).replace(".", ",")} m²` : "";
}
