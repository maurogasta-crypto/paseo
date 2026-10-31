// ─────────────────────────────────────────────────────────────────────────────
// nucleo.js — Lo que comparten las pantallas del paseo. Sello: nucleo-1
// (31-oct-2026). No se duplica: si algo hace falta en dos pantallas, sube acá.
//
// · Las causas de los errores en castellano salen de `errores.js` del panel
//   (maurogasta-crypto/datos, PROTOCOLO-INTERFAZ § 7.2), pedido diferido y con
//   catch: si no baja, se ve el código como antes. Acá se suman SÓLO las
//   causas propias de este sitio.
// · El ojo 👁 de las contraseñas es `ojos.js` del panel, la misma copia para
//   todos los sitios; también diferido: sin él la contraseña anda igual.
// ─────────────────────────────────────────────────────────────────────────────
import { CLOUDINARY, FOTO_LADO, problemaDelArchivo, VERSION as V_ALBUM } from "./album.js";

export const VERSION = "nucleo-1";
export const SELLOS = () => [VERSION, V_ALBUM];

const DATOS = "https://maurogasta-crypto.github.io/datos/";
let _errores = null;
import(DATOS + "errores.js").then((m) => { _errores = m; }).catch(() => {});
import(DATOS + "ojos.js").catch(() => {});

const PROPIAS = {
  "permission-denied": "La base dijo que no: esta cuenta no tiene permiso para esa escritura. Escriben sólo Mauro y el agente (firestore.rules v1); si recién se cambiaron las reglas, puede que todavía no estén publicadas en la consola de Firebase (proyecto Pruebas).",
  "sdk-no-baja": "No se pudo cargar Firebase desde gstatic.com: suele ser falta de señal o una red que bloquea ese dominio."
};
export function explicar(e) {
  if (_errores) return _errores.explicar(e, PROPIAS);
  const c = e && e.code;
  if (c && PROPIAS[c]) return PROPIAS[c] + " · " + c;
  return (e && (e.code || e.message)) || String(e || "Error desconocido");
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Una foto se achica en el teléfono antes de subir (2000 px de lado mayor):
   una foto de 12 MP pasa de 4 MB a unos 400 KB, entra en el cupo gratis de
   Cloudinary y se ve igual en cualquier pantalla. */
export async function achicar(file, lado = FOTO_LADO) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, lado / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
}

/* Sube UN archivo a Cloudinary con el preset sin firma, avisando el progreso
   (0 a 1). Con fetch no hay progreso de subida; con XHR sí, y un video de
   80 MB por 4G sin una barra parece colgado. Devuelve { url, tipo }. */
export function subir(file, alProgreso = () => {}) {
  const prob = problemaDelArchivo(file);
  if (prob) return Promise.reject(new Error(prob));
  const video = /^video\//.test(file.type);
  return (async () => {
    const cuerpo = video ? file : await achicar(file);
    const fd = new FormData();
    fd.append("file", cuerpo, video ? file.name : "foto.jpg");
    fd.append("upload_preset", CLOUDINARY.preset);
    fd.append("asset_folder", "paseo/general-flores");
    return new Promise((ok, mal) => {
      const x = new XMLHttpRequest();
      x.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/${video ? "video" : "image"}/upload`);
      x.upload.onprogress = (ev) => { if (ev.lengthComputable) alProgreso(ev.loaded / ev.total); };
      x.onload = () => {
        let j = null; try { j = JSON.parse(x.responseText); } catch (_) {}
        if (x.status >= 200 && x.status < 300 && j && j.secure_url) ok({ url: j.secure_url, tipo: video ? "video" : "foto" });
        else mal(new Error(`Cloudinary no aceptó «${file.name}»` + (j && j.error && j.error.message ? ": " + j.error.message : ` (${x.status})`)));
      };
      x.onerror = () => mal(new Error(`Se cortó la red subiendo «${file.name}»`));
      x.send(fd);
    });
  })();
}

export function pintarSello(el) {
  if (el) el.textContent = SELLOS().join(" · ");
}
