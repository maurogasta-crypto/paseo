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

## Dominio propio

**`paseoprimerodemayo.com`**, comprado el 22-nov-2026 en Spaceship (titularidad: ficha `titularidad-paseo` del panel).
Los nameservers son los de Spaceship y los registros apuntan a GitHub Pages:

| Tipo | Host | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153` |
| CNAME | `www` | `maurogasta-crypto.github.io` |
| TXT | `_github-pages-challenge-maurogasta-crypto` | el código que da GitHub al verificar el dominio |

El dominio se carga en **Settings → Pages → Custom domain** del repo, con «Enforce HTTPS». Al guardarlo (22-nov)
GitHub creó el archivo **`CNAME`** en la raíz (`paseoprimerodemayo.com`): **no se borra**. En Settings → Pages la
fuente figura como «Deploy from a branch» (`main`, raíz), y con esa fuente el dominio vive en ese archivo. Las direcciones de
`github.io/paseo/` pasan solas al dominio. La portada lee la base por REST y la base contesta desde el dominio
(probado el 22-nov); los enlaces son relativos, así que no hay que cambiar nada del código.

## Mapa de archivos

| Archivo | Sello | Qué es |
|---|---|---|
| `index.html` | `portada-8` | La portada pública: la **propuesta del lienzo** «Paseo Primero de Mayo — Espacios» (21-nov), pasada entera el 22-nov a pedido de Mauro (convocatoria abierta, dos maneras de ser parte, los espacios con su video, sus fotos y cada ambiente del primer piso, condiciones, contacto por WhatsApp y la fachada que se propone). Lee el álbum por la API REST, sin SDK ni sesión: los textos generales viven en la página; los espacios, en el álbum |
| `fachada-fondo.jpg` | — | La foto del frente que usaba de fondo la portada 2 a 7; **ya no se usa** (la portada 8 toma la fachada propuesta del álbum) |
| `admin.html` | `admin-2` | El editor (cada parte tiene «Línea de arriba» y «Área común») |
| `diagnostico.html` | `diag-1` | Qué anda y qué no; no depende del núcleo |
| `album.js` | `album-2` | La forma del álbum y todo lo que se calcula de ella (también `partesDe`, `whatsapp`, `tapa`, `alta`). Sin navegador ni Firebase |
| `nucleo.js` | `nucleo-1` | Lo que comparten las pantallas: errores con causa, el ojo 👁, achicar y subir a Cloudinary |
| `firebase-init.js` | `init-1` | El único contacto con el SDK de Firebase, cargado diferido |
| `firestore.rules` | v2 | La plantilla de las reglas (UID como marcadores) |
| `pruebas.mjs` | — | El banco: `node pruebas.mjs` (29 casos, sin npm ni red) |
| `.github/workflows/pages.yml` | — | Publica en GitHub Pages en cada push a `main` |

## La forma del álbum

Un documento, `albumes/general-flores` de `pruebas-db555`:

```
titulo, subtitulo, descripcion, contacto
portada                  id del medio que va grande arriba
secciones.<id>           { nombre, orden, visible, descripcion, superficie, estado, portada,
                           ubicacion (la línea de arriba), comun (área común: no se alquila) }
medios.<id>              { seccion, orden, tipo: foto|video, url, titulo, detalle, creadoEn }
actualizadoEn, actualizadoPor
```

En una parte, el **primer video** es su recorrido; las fotos van en la grilla; los **demás videos** son
«cada ambiente por separado», con su título (así el primer piso muestra sus 10 ambientes). La parte
oculta **«Portada»** guarda el video de la entrada y la foto de la fachada propuesta (`portada` del álbum).
El contacto es texto (hoy «Mauro Gastaldello · WhatsApp 099 696 333»): la portada saca de ahí el número
para WhatsApp (`whatsapp`, que agrega el 598).

**Qué hay cargado (22-nov-2026):** Showroom (video + 6 fotos, y el video que ya estaba), Galería y acceso
(área común: video + 2 fotos), Depósito (6 fotos), Primer piso (recorrido + 11 fotos + 10 ambientes),
Depósito de entrepiso (al final del primer piso, después de las oficinas; en el lienzo figuraba como
«Galpón»: video) y Piso superior (= segundo piso: recorrido + 8 fotos). Salió del lienzo de Mauro: los
archivos se bajaron de ahí y se subieron a Cloudinary (etiqueta `propuesta-21nov`), sin las tapas de los
videos, que Cloudinary saca del video mismo.

El detalle, con el porqué, está comentado arriba de `album.js`.

## Reglas

Leer un álbum por su id: cualquiera. Listar: Mauro y el agente. Escribir: Mauro y el
agente. `_historial`: se crea y se lee, nunca se edita ni se borra. Todo lo
demás, cerrado. Se publican desde el panel (Sitios → paseo), que reemplaza los
marcadores por los UID de verdad.
