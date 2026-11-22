// pruebas.mjs — El banco del paseo. Sin npm, sin red, sin navegador:
//   node pruebas.mjs
// Prueba la forma del álbum (album.js), que todo el JavaScript parsee COMO
// MÓDULO (también el que vive adentro de un .html), las reglas, y que ninguna
// página importe el SDK por su cuenta.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as A from "./album.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const leer = (f) => fs.readFileSync(path.join(raiz, f), "utf8");
let pasadas = 0, fallidas = 0;
const prueba = (n, f) => { try { f(); pasadas++; console.log("  ✓ " + n); } catch (e) { fallidas++; console.log("  ✗ " + n + "\n      " + e.message); } };

const URL_F = "https://res.cloudinary.com/cwbnaivv/image/upload/v1/paseo/a.jpg";
const URL_V = "https://res.cloudinary.com/cwbnaivv/video/upload/v1/paseo/b.mp4";

/* La forma vieja, tal como estaba en la base el 31-oct (sin datos reales). */
const VIEJA = {
  titulo: "Paseo Primero de Mayo", subtitulo: "Complejo", descripcion: "texto",
  portadaUrl: "https://res.cloudinary.com/cwbnaivv/image/upload/v1/portada.jpg",
  secciones: [
    { nombre: "Planta Baja (Showroom)", orden: 1, visible: true, medios: [
      { titulo: "video", tipo: "video", url: URL_V, urlThumbnail: "x.jpg", creadoEn: "2026-10-30", detalle: "" },
      { titulo: "ajena", tipo: "image", url: "https://otro.com/x.jpg" }] },
    { nombre: "Depósito", visible: false, medios: [{ titulo: "f", tipo: "image", url: URL_F, detalle: "pie" }] }
  ]
};

prueba("la forma vieja (lista) se lee entera y avisa que es vieja", () => {
  const a = A.normalizar(VIEJA);
  assert.equal(a.vieja, true);
  const secs = A.secciones(a);
  assert.deepEqual(secs.map((s) => s.nombre), ["Portada", "Planta Baja (Showroom)", "Depósito"]);
  assert.equal(secs.find((s) => s.nombre === "Depósito").visible, false);
  assert.equal(A.mediosDe(a, "s1").length, 1, "la de otra cuenta no entra");
  assert.equal(A.mediosDe(a, "s1")[0].tipo, "video");
  assert.equal(A.mediosDe(a, "s2")[0].tipo, "foto", "«image» pasa a «foto»");
  assert.equal(A.mediosDe(a, "s2")[0].detalle, "pie");
  assert.ok(!("urlThumbnail" in A.mediosDe(a, "s1")[0]), "la miniatura no se guarda: se deriva");
});
prueba("la portada vieja (una URL suelta) no se pierde: va a una parte oculta", () => {
  const a = A.normalizar(VIEJA);
  assert.equal(a.portada, "portada1");
  assert.equal(a.secciones.portada.visible, false);
  assert.equal(A.portadaDelAlbum(a).url, VIEJA.portadaUrl);
});
prueba("si la portada vieja ya era uno de los medios, se apunta a ése y no se duplica", () => {
  const a = A.normalizar({ ...VIEJA, portadaUrl: URL_F });
  assert.equal(a.medios[a.portada].url, URL_F);
  assert.ok(!a.secciones.portada);
});
prueba("lo que se guarda al pasar no lleva la marca «vieja»", () => {
  const g = A.paraGuardar(A.normalizar(VIEJA));
  assert.ok(!("vieja" in g)); assert.ok(!Array.isArray(g.secciones));
  assert.equal(A.normalizar(g).vieja, false, "leída de nuevo es la forma nueva");
  assert.deepEqual(A.normalizar(g).medios, A.normalizar(VIEJA).medios, "ida y vuelta, los mismos medios");
});
prueba("la forma nueva: un medio de una parte que no existe no se muestra", () => {
  const a = A.normalizar({ secciones: { s1: { nombre: "A", orden: 10 } },
    medios: { m1: { seccion: "s1", orden: 10, tipo: "foto", url: URL_F }, m2: { seccion: "sX", url: URL_F } } });
  assert.deepEqual(Object.keys(a.medios), ["m1"]);
});
prueba("una parte sin nombre no existe; un estado inventado queda vacío", () => {
  const a = A.normalizar({ secciones: { s1: { nombre: "" }, s2: { nombre: "B", estado: "regalado" } } });
  assert.deepEqual(Object.keys(a.secciones), ["s2"]);
  assert.equal(a.secciones.s2.estado, "");
});
prueba("sólo se dibuja lo de NUESTRA cuenta de Cloudinary", () => {
  assert.ok(A.esMedioNuestro(URL_F)); assert.ok(A.esMedioNuestro(URL_V));
  assert.ok(!A.esMedioNuestro("https://res.cloudinary.com/otra/image/upload/a.jpg"));
  assert.ok(!A.esMedioNuestro("javascript:alert(1)"));
  assert.ok(!A.esMedioNuestro(undefined));
});
prueba("las partes y los medios salen en orden; el oculto se filtra para el público", () => {
  const a = A.normalizar({ secciones: { b: { nombre: "B", orden: 20 }, a: { nombre: "A", orden: 10 }, c: { nombre: "C", orden: 5, visible: false } },
    medios: { y: { seccion: "a", orden: 20, url: URL_F }, x: { seccion: "a", orden: 10, url: URL_F } } });
  assert.deepEqual(A.secciones(a).map((s) => s.id), ["c", "a", "b"]);
  assert.deepEqual(A.secciones(a, { soloVisibles: true }).map((s) => s.id), ["a", "b"]);
  assert.deepEqual(A.mediosDe(a, "a").map((m) => m.id), ["x", "y"]);
});
prueba("intercambiar cambia sólo dos órdenes, y separa dos que eran iguales", () => {
  const l = [{ id: "a", orden: 10 }, { id: "b", orden: 20 }, { id: "c", orden: 30 }];
  assert.deepEqual(A.intercambiar(l, "b", -1), { b: 10, a: 20 });
  assert.equal(A.intercambiar(l, "a", -1), null);
  assert.equal(A.intercambiar(l, "c", 1), null);
  const r = A.intercambiar([{ id: "a", orden: 10 }, { id: "b", orden: 10 }], "b", -1);
  assert.ok(r.b < r.a, "con orden repetido el ▲ igual sube");
});
prueba("ordenAlFinal y la portada de una parte (la elegida, si no la primera foto)", () => {
  assert.equal(A.ordenAlFinal([]), 10);
  assert.equal(A.ordenAlFinal([{ orden: 10 }, { orden: 40 }]), 50);
  const a = A.normalizar({ secciones: { s: { nombre: "S", portada: "m2" } },
    medios: { m1: { seccion: "s", orden: 1, tipo: "video", url: URL_V }, m2: { seccion: "s", orden: 2, tipo: "foto", url: URL_F }, m3: { seccion: "s", orden: 3, tipo: "foto", url: URL_F } } });
  a.secciones.s.portada = "m3";
  assert.equal(A.portadaDe(a, "s").id, "m3", "la elegida");
  a.secciones.s.portada = "";
  assert.equal(A.portadaDe(a, "s").id, "m2", "sin elegir: la primera FOTO, aunque haya un video antes");
});
prueba("las miniaturas salen de la URL (Cloudinary las hace al vuelo)", () => {
  assert.match(A.mini({ tipo: "foto", url: URL_F }), /\/image\/upload\/w_480,h_360,c_fill,q_auto,f_auto\//);
  const v = A.mini({ tipo: "video", url: URL_V });
  assert.match(v, /\/video\/upload\/so_1,/); assert.match(v, /\.jpg$/);
  assert.equal(A.mini({ tipo: "foto", url: "https://otro/x.jpg" }), "");
});
prueba("un archivo se rechaza ANTES de subir, con la razón", () => {
  assert.equal(A.problemaDelArchivo({ name: "a.jpg", type: "image/jpeg", size: 9e6 }), "");
  assert.match(A.problemaDelArchivo({ name: "a.pdf", type: "application/pdf", size: 1 }), /no es una foto ni un video/);
  assert.match(A.problemaDelArchivo({ name: "v.mp4", type: "video/mp4", size: 150 * 1048576 }), /100 MB/);
  assert.equal(A.problemaDelArchivo({ name: "v.mp4", type: "video/mp4", size: 90 * 1048576 }), "");
});
prueba("el documento de la API REST se desenvuelve entero", () => {
  const j = { fields: { titulo: { stringValue: "T" }, secciones: { mapValue: { fields: { s1: { mapValue: { fields: {
    nombre: { stringValue: "A" }, orden: { integerValue: "10" }, visible: { booleanValue: true }, superficie: { doubleValue: 42.5 } } } } } } } } };
  const d = A.documentoDeFirestore(j);
  assert.deepEqual(d, { titulo: "T", secciones: { s1: { nombre: "A", orden: 10, visible: true, superficie: 42.5 } } });
  assert.equal(A.superficieTexto(A.normalizar(d).secciones.s1), "42,5 m²");
});

/* ── El código ── */
const JS = ["album.js", "nucleo.js", "firebase-init.js", "pruebas.mjs"];
const HTML = ["index.html", "admin.html", "diagnostico.html"];
const parsea = (codigo, nombre) => {
  try { execFileSync(process.execPath, ["--input-type=module", "--check"], { input: codigo, stdio: ["pipe", "pipe", "pipe"] }); }
  catch (e) { throw new Error(`${nombre} no parsea como módulo:\n${String(e.stderr).split("\n").slice(0, 4).join("\n")}`); }
};
prueba("todo el JavaScript parsea COMO MÓDULO, también el de adentro de los .html", () => {
  for (const f of JS) parsea(leer(f), f);
  for (const f of HTML) {
    const bloques = [...leer(f).matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.ok(bloques.length, `${f} sin módulo`);
    bloques.forEach((b, i) => parsea(b, `${f} (módulo ${i + 1})`));
  }
});
prueba("sólo firebase-init.js toca gstatic, y diferido (import(), nunca estático)", () => {
  for (const f of [...JS, ...HTML].filter((x) => x !== "firebase-init.js")) {
    assert.doesNotMatch(leer(f), /gstatic\.com\/firebasejs/, `${f} importa el SDK por su cuenta`);
  }
  const fi = leer("firebase-init.js");
  assert.doesNotMatch(fi, /^import\s.*gstatic/m); assert.match(fi, /import\(SDK \+ "firebase-app\.js"\)/);
});
prueba("la portada no carga el SDK ni la sesión: lee por REST", () => {
  const s = leer("index.html");
  assert.doesNotMatch(s, /cargarFirebase|nucleo\.js/);
  assert.match(s, /firestore\.googleapis\.com\/v1\/projects/);
});
prueba("ojos.js y errores.js del panel se piden diferidos, con catch", () => {
  const n = leer("nucleo.js");
  assert.match(n, /import\(DATOS \+ "errores\.js"\)\.then\([^\n]*\.catch\(/);
  assert.match(n, /import\(DATOS \+ "ojos\.js"\)\.catch\(/);
  assert.match(n, /if \(_errores\) return _errores\.explicar\(/, "sin respaldo para cuando no bajó");
});
prueba("album-2: cada parte lee su línea de arriba y si es área común (y una de antes, sin esos campos, también)", () => {
  const a = A.normalizar({ secciones: { s1: { nombre: "Showroom", orden: 10, ubicacion: "  Planta baja · Frente  ", comun: true }, s2: { nombre: "Depósito", orden: 20 } }, medios: {} });
  assert.equal(a.secciones.s1.ubicacion, "Planta baja · Frente");
  assert.equal(a.secciones.s1.comun, true);
  assert.equal(a.secciones.s2.ubicacion, "");
  assert.equal(a.secciones.s2.comun, false, "sin el campo, no es área común");
  assert.equal(A.normalizar({ secciones: { s: { nombre: "x", comun: "sí" } } }).secciones.s.comun, false, "sólo true cuenta");
});
prueba("partesDe: el primer video es el recorrido, las fotos aparte, los demás videos son los ambientes (en orden)", () => {
  const a = A.normalizar({ secciones: { p: { nombre: "Primer piso" } }, medios: {
    f1: { seccion: "p", orden: 100, tipo: "foto", url: URL_F }, v2: { seccion: "p", orden: 310, tipo: "video", url: URL_V, titulo: "Baño" },
    v0: { seccion: "p", orden: 10, tipo: "video", url: URL_V, titulo: "Recorrido completo" }, v1: { seccion: "p", orden: 300, tipo: "video", url: URL_V, titulo: "Hall" } } });
  const p = A.partesDe(a, "p");
  assert.equal(p.recorrido.titulo, "Recorrido completo");
  assert.deepEqual(p.fotos.map((m) => m.id), ["f1"]);
  assert.deepEqual(p.ambientes.map((m) => m.titulo), ["Hall", "Baño"]);
  assert.equal(A.partesDe(a, "nada").recorrido, null);
});
prueba("whatsapp: un celular uruguayo como se marca acá pasa a 598; si no hay número, nada", () => {
  assert.equal(A.whatsapp("Mauro · WhatsApp 099 696 333"), "59899696333");
  assert.equal(A.whatsapp("+598 99 696 333"), "59899696333");
  assert.equal(A.whatsapp("escribinos"), "");
  assert.equal(A.whatsapp(""), "");
});
prueba("tapa y alta: sólo de nuestra cuenta, verticales y del tipo que corresponde", () => {
  assert.match(A.tapa({ tipo: "video", url: URL_V }, 540), /\/video\/upload\/so_1,w_540,h_960,c_fill,q_auto\/v1\/paseo\/b\.jpg$/);
  assert.equal(A.tapa({ tipo: "foto", url: URL_F }), "");
  assert.equal(A.tapa({ tipo: "video", url: "https://otro.com/x.mp4" }), "");
  assert.match(A.alta({ tipo: "foto", url: URL_F }, 540), /w_540,h_960,c_fill/);
});
prueba("la portada saca los espacios del álbum y no inventa contacto ni medios ajenos", () => {
  const s = leer("index.html");
  assert.match(s, /A\.partesDe\(a, s\.id\)/); assert.match(s, /A\.whatsapp\(a\.contacto\)/);
  assert.doesNotMatch(s, /wa\.me\/\d/, "el número no se escribe en la página: sale del álbum");
  assert.doesNotMatch(s, /res\.cloudinary\.com\/[a-z0-9]+\/(image|video)\/upload\/v\d/, "ningún medio fijo en la página");
});
prueba("cada archivo con lógica lleva su sello", () => {
  for (const f of ["album.js", "nucleo.js", "firebase-init.js", ...HTML]) assert.match(leer(f), /Sello:\s*[a-z]+-\d+/, f);
});
prueba("el editor no decide por rol ni guarda el álbum entero en cada cambio", () => {
  const s = leer("admin.html");
  assert.doesNotMatch(s, /\.set\(currentAlbumData/);
  assert.match(s, /F\.updateDoc\(ref\(\)/);
  assert.doesNotMatch(s, /rol\s*[!=]==/);
});
prueba("elegir son DOS inputs, cámara y archivos", () => {
  const s = leer("admin.html");
  assert.match(s, /id="uCamara"[^>]*capture=/); assert.match(s, /id="uArchivos"[^>]*multiple/);
});

/* ── Las reglas ── */
prueba("las reglas: deny por defecto, sin comodín; get para todos, list sólo para quien escribe", () => {
  const r = leer("firestore.rules");
  assert.doesNotMatch(r, /match \/\{document=\*\*\}/, "un comodín abre lo que no tiene regla");
  assert.match(r, /match \/albumes\/\{id\} \{[\s\S]*?allow get: if true;[\s\S]*?allow list: if escribe\(\);/);
  assert.equal((r.match(/if true/g) || []).length, 1, "un solo «if true»: el get del álbum");
  assert.match(r, /match \/_historial\/\{id\} \{[\s\S]*?allow update, delete: if false;/);
});
prueba("en las reglas los UID son marcadores: ninguno real entra al repositorio", () => {
  const r = leer("firestore.rules");
  assert.match(r, /"TU-UID-ACA"/); assert.match(r, /"UID-DEL-AGENTE"/);
  assert.doesNotMatch(r, /"[A-Za-z0-9]{28}"/);
});
prueba("ningún archivo trae algo con forma de secreto (api_secret, service account)", () => {
  for (const f of [...JS, ...HTML, "firestore.rules"].filter((x) => x !== "pruebas.mjs")) assert.doesNotMatch(leer(f), /api_secret\s*[:=]|private_key|BEGIN PRIVATE/, f);
});
prueba("cargar.html ya no está (pedía la cuenta de Cloudinary a mano)", () => {
  assert.ok(!fs.existsSync(path.join(raiz, "cargar.html")));
});

console.log(`\n  ${pasadas} pasadas, ${fallidas} fallidas\n`);
process.exit(fallidas ? 1 : 0);
