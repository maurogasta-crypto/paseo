/* ═══════════════════════════════════════════════════════════
   firebase-init.js — EL ÚNICO CONTACTO CON EL SDK DE FIREBASE.
   Sello: init-1 (31-oct-2026)

   Ninguna otra página importa nada de gstatic.com. Si cambia la versión del
   SDK o el proyecto, se toca acá. Es la regla de los otros sitios
   (PROTOCOLO-DESARROLLO § 2, repo `maurogasta-crypto/datos`).

   LA CONFIGURACIÓN NO ES UN SECRETO: identifica el proyecto «Pruebas»
   (pruebas-db555) ante la API web y no da un solo permiso. Lo que da o niega
   acceso son las reglas (`firestore.rules`). El aviso de GitHub del 30-oct
   («Google API Key») era esta clave: pública por diseño, no hay que rotarla.

   EL SDK SE CARGA DIFERIDO, con `import()` dentro de un try. Un import
   estático deja la página entera en blanco si gstatic no contesta; así la
   pantalla abre igual y dice qué falta. Lo que se exporta son `let`
   (enlaces vivos): valen `undefined` hasta que `cargarFirebase()` resuelve,
   así que nada que use Firebase puede correr antes de esa espera.

   La portada (index.html) NO pasa por acá: lee el álbum por la API REST, sin
   SDK y sin sesión, y se ve aunque gstatic esté caído.
   ═══════════════════════════════════════════════════════════ */

export const VERSION = "init-1";
const SDK = "https://www.gstatic.com/firebasejs/12.16.0/";

export const firebaseConfig = {
  apiKey: "AIzaSyAyrHTkm8k2iv_14eQKKCrFyOrgD9mwgHo",
  authDomain: "pruebas-db555.firebaseapp.com",
  projectId: "pruebas-db555",
  storageBucket: "pruebas-db555.firebasestorage.app",
  messagingSenderId: "1009675675879",
  appId: "1:1009675675879:web:eea1f465e6d41b460e5a42"
};

export let app, auth, db;
export let onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail;
export let doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField;
export let cargado = null;

let _promesa = null;
export function cargarFirebase() {
  if (_promesa) return _promesa;
  _promesa = (async () => {
    let mA, mU, mF;
    try {
      [mA, mU, mF] = await Promise.all([
        import(SDK + "firebase-app.js"),
        import(SDK + "firebase-auth.js"),
        import(SDK + "firebase-firestore.js")
      ]);
    } catch (e) {
      const err = new Error("No se pudo cargar Firebase desde gstatic.com. Suele ser falta de señal o una red que bloquea ese dominio.");
      err.code = "sdk-no-baja"; err.causa = e;
      _promesa = null; cargado = false;
      throw err;
    }
    app = mA.getApps().length ? mA.getApp() : mA.initializeApp(firebaseConfig);
    auth = mU.getAuth(app);
    ({ onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } = mU);
    db = mF.getFirestore(app);
    ({ doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField } = mF);
    cargado = true;
  })();
  return _promesa;
}
