# Paseo Primero de Mayo · General Flores

Los locales y espacios para alquilar del Paseo Primero de Mayo, con fotos y
videos de cada parte del edificio.

- **Sitio:** https://maurogasta-crypto.github.io/paseo/
- **Editor:** https://maurogasta-crypto.github.io/paseo/admin.html
- **Diagnóstico:** https://maurogasta-crypto.github.io/paseo/diagnostico.html

## Cómo se carga

1. Entrar al editor con la cuenta de la base.
2. **Las partes del local**: agregar cada una («Planta baja · showroom»,
   «Primer piso · oficinas»…), con su descripción, superficie en m² y estado
   (disponible, reservado, alquilado). ▲▼ las ordena; «Ocultar» la saca de la
   vista del público sin borrarla.
3. **Subir**: elegir la parte, y después 📷 sacar con la cámara o 🖼 elegir
   archivos (fotos y videos, varios a la vez). Se suben recién al tocar
   «Subir», con una barra por archivo.
4. En cada foto o video: título, pie de foto, ◀▶ para ordenar, mover a otra
   parte, ★ foto grande de la portada, ☆ la que representa a esa parte, ✕
   sacar del álbum.

Lo que se cambia se ve en el sitio al recargar. Si dos personas cargan a la
vez, no se pisan: cada cambio escribe sólo lo suyo y el editor muestra en vivo
lo que sube el otro.

## Mapa de archivos

| Archivo | Sello | Qué es |
|---|---|---|
| `index.html` | `portada-1` | La portada pública. Lee el álbum por la API REST, sin SDK ni sesión |
| `admin.html` | `admin-1` | El editor |
| `diagnostico.html` | `diag-1` | Qué anda y qué no; no depende del núcleo |
| `album.js` | `album-1` | La forma del álbum y todo lo que se calcula de ella. Sin navegador ni Firebase |
| `nucleo.js` | `nucleo-1` | Lo que comparten las pantallas: errores con causa, el ojo 👁, achicar y subir a Cloudinary |
| `firebase-init.js` | `init-1` | El único contacto con el SDK de Firebase, cargado diferido |
| `firestore.rules` | v1 | La plantilla de las reglas (UID como marcadores) |
| `pruebas.mjs` | — | El banco: `node pruebas.mjs` (24 casos, sin npm ni red) |
| `.github/workflows/pages.yml` | — | Publica en GitHub Pages en cada push a `main` |

## La forma del álbum

Un documento, `albumes/general-flores` de `pruebas-db555`:

```
titulo, subtitulo, descripcion, contacto
portada                  id del medio que va grande arriba
secciones.<id>           { nombre, orden, visible, descripcion, superficie, estado, portada }
medios.<id>              { seccion, orden, tipo: foto|video, url, titulo, detalle, creadoEn }
actualizadoEn, actualizadoPor
```

El detalle, con el porqué, está comentado arriba de `album.js`.

## Reglas

Leer un álbum por su id: cualquiera. Listar: nadie. Escribir: Mauro y el
agente. `_historial`: se crea y se lee, nunca se edita ni se borra. Todo lo
demás, cerrado. Se publican desde el panel (Sitios → paseo), que reemplaza los
marcadores por los UID de verdad.
