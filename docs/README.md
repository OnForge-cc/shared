# @onforge/shared — documentación

**El código común de las apps de OnForge.** UI (`ui/`, `components/`), cliente
CRUD y helpers (`lib/`, `hooks/`), el mundo visual y sus piezas (`styles/`,
`sky/`) y tres módulos de worker (`worker/response`, `worker/email`,
`worker/cookies`). Envía TypeScript crudo: lo compila el bundler de la app que
lo consume.

`ui/`, `lib/`, `hooks/`, `components/` y `sky/` asumen el DOM; `worker/` asume
`@cloudflare/workers-types`. Nunca se importa cruzando esa frontera (hay dos
`tsconfig` por eso).

El pin es a un **tag** de git, no a master (`v1.2.0`, por crear, en los cuatro
consumidores: onforge y las tres consolas del subproyecto 4). Las dependencias de runtime
son `peerDependencies`; cada consumidor las deduplica (`dedupe` en su
`vite.config.ts`) para que no haya dos React.

## Sky: el mundo «Clear Sky» de noche (2026-10-05)

Desde el subproyecto 4 el mundo visual de OnForge vive aquí y no en cada repo:

| Qué | Dónde | Quién lo consume |
|---|---|---|
| El mundo: tokens, tipografía, píldoras, tarjetas, vidrio, héroe, terminal, páginas interiores y el **bloque de consola** (el vocabulario del mapa reinterpretado en la noche, la barra lateral, el Logbook) | `styles/sky.css` (sobre `styles/site.css`) | los cuatro repos, desde su `index.css` |
| El kit del sitio: marca, píldora, flecha; cabecera de página con el cielo, sección, aro, recorrido en pasos, preguntas, control segmentado, cierre | `sky/kit.tsx`, `sky/page.tsx`, `sky/sky-canvas.tsx`, `sky/night.ts`, `sky/hooks.ts` | onforge (envuelto en `features/frontend/sky/page.tsx`), partners, developers |
| El documento de referencia: dos rieles, filtro, índice móvil y los bloques comunes | `sky/reference.tsx` | partners (`/programme`), developers (`/docs`) |
| El marco de consola: barra lateral con destinos, barra superior con el rastro y la cuenta, salida por `#signout` | `sky/console-frame.tsx` | admin, partners (`/dashboard`) |
| Las piezas de consola: `Section`, `CallingAt`, `Masthead`, `Stamp`, campos, `StatusBox`, `Note`, `SaveRow`, `SheetDialog`… | `sky/console.tsx`, `lib/use-copy.ts` | onforge (consola de apps), admin, partners |
| El cliente de plataforma: `platformOrigin()` (`VITE_PLATFORM_ORIGIN`; localhost → `:8788`), `api()` con credenciales, `fetchMe()`, `signInUrl()`, `signOutAndGo()` | `lib/platform-client.ts` | admin, partners, developers |

Reglas que las piezas ya cumplen y que un consumidor no debe deshacer (están
en la cabecera de `sky.css` y en el `DESIGN.md` de cada consola): sólo noche;
el ámbar como único acento; el verde sólo para `live`; Geist, y Geist Mono sólo
para lo que se teclea; elevación por luz, nunca borde y sombra a la vez; vidrio
sólo donde algo flota. Los iconos se tipan por su forma (`IconComponent`) porque
cada consumidor trae su propia copia de lucide-react.

## Módulos

<!-- BEGIN generated:modules -->
<!-- No edites aquí: lo reescribe `npm run docs`. -->

Módulos de las carpetas publicadas (47), con la primera línea de su comentario de cabecera.

| Archivo | Qué hace |
| --- | --- |
| [`components/confirm-delete-modal.tsx`](../components/confirm-delete-modal.tsx) | «¿Seguro?» antes de un borrado, igual en toda la plataforma. |
| [`components/form-modal.tsx`](../components/form-modal.tsx) | El envoltorio de cualquier formulario en diálogo: título, descripción y hueco. |
| [`components/theme-provider.tsx`](../components/theme-provider.tsx) | El mundo del mapa se lee a la luz del día: no hay tema oscuro en el sitio, en la puerta, en las consolas ni en las apps (decidido el 2026-09-29). |
| [`lib/crud-api.ts`](../lib/crud-api.ts) | El cliente CRUD que se repetía en cada feature, escrito una vez. |
| [`lib/crud-hooks.ts`](../lib/crud-hooks.ts) | Los hooks de React Query que van encima de `crud-api.ts`. |
| [`lib/initials.ts`](../lib/initials.ts) | Dos letras en lugar de alguien que todavía no tiene avatar. |
| [`lib/platform-client.ts`](../lib/platform-client.ts) | Hablar con el control plane desde una consola que vive en otro origen (admin., partners., developers. |
| [`lib/use-copy.ts`](../lib/use-copy.ts) | Copiar, hecho una sola vez para todo el proyecto: la misma implementación que partners y developers, la que usa `CopyTicket` en `console.tsx`. |
| [`lib/utils.ts`](../lib/utils.ts) | `cn` — juntar clases de Tailwind sin que se peleen entre ellas. |
| [`lib/vite-env.d.ts`](../lib/vite-env.d.ts) | Las variables de build que lee el paquete (`import.meta.env`). |
| [`sky/console-frame.tsx`](../sky/console-frame.tsx) | El marco de consola de admin, partners y developers, en el mundo «Clear Sky» de noche: la forma de una app de trabajo, la misma que la consola de onforge. |
| [`sky/console.tsx`](../sky/console.tsx) | Las piezas de la consola, en el mundo «Clear Sky» de noche (2026-10-05). |
| [`sky/hooks.ts`](../sky/hooks.ts) | Hooks de scroll y de montaje contra los que se animan las páginas de Clear Sky, y los tres que usan las piezas de consola de `console.tsx` (`useFlash`, `useDismiss`,… |
| [`sky/kit.tsx`](../sky/kit.tsx) | Las piezas del mundo de OnForge («Clear Sky» de noche): la marca, la píldora y la flecha. |
| [`sky/night.ts`](../sky/night.ts) | El documento entero es de noche mientras se ve una página de Clear Sky: el fondo de `<html>` (lo que asoma en el rebote del scroll) y el color de la barra del navegador. |
| [`sky/page.tsx`](../sky/page.tsx) | Las piezas de página del mundo de OnForge («Clear Sky» de noche), compartidas por el sitio de onforge y las páginas públicas de partners y developers: la cabecera de… |
| [`sky/platform-client.test.ts`](../sky/platform-client.test.ts) | El cliente de plataforma: la URL de entrada, las credenciales en cada llamada, la frase del servidor y un solo refresh. |
| [`sky/platform-origin.test.ts`](../sky/platform-origin.test.ts) | Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. |
| [`sky/reference.tsx`](../sky/reference.tsx) | Un documento de referencia en el mundo «Clear Sky» de noche: las condiciones del programa de partners (`/programme`) y la documentación de developers (`/docs`). |
| [`sky/sky-canvas.tsx`](../sky/sky-canvas.tsx) | El cielo de OnForge: un solo shader WebGL2, sin dependencias. |
| [`ui/alert-dialog.tsx`](../ui/alert-dialog.tsx) | El diálogo de consecuencias: el mismo papel que `Dialog`, pero no se cierra al pulsar fuera y el foco empieza en «Cancel», el lado que no hace nada. |
| [`ui/avatar.tsx`](../ui/avatar.tsx) | La cara de alguien es su monograma: su foto, o sus iniciales en el corte condensado, dentro de un cuadrado con el trazo del mundo. |
| [`ui/badge.tsx`](../ui/badge.tsx) | El sello: un estado impreso en una caja con el trazo del mundo. |
| [`ui/button.tsx`](../ui/button.tsx) | El billete: la única forma de botón del mundo del mapa (ver `styles/site.css`, «billetes y botones»). |
| [`ui/card.tsx`](../ui/card.tsx) | En el mundo del mapa no hay tarjetas: hay paradas. |
| [`ui/checkbox.tsx`](../ui/checkbox.tsx) | La casilla del mundo: un cuadrado con el trazo de 3px que se llena de tinta. |
| [`ui/command.tsx`](../ui/command.tsx) | La paleta de órdenes sobre cmdk: el campo de búsqueda cerrado por el filete grueso, los grupos con rótulo de andén y las filas del panel de papel. |
| [`ui/dialog.tsx`](../ui/dialog.tsx) | El diálogo de papel sobre Radix: el trazo de 3px sobre papel, la única penumbra del mundo detrás (tinta al 70 %), una cabecera cerrada por el filete grueso, el aspa… |
| [`ui/dropdown-menu.tsx`](../ui/dropdown-menu.tsx) | El menú de acciones sobre Radix: un panel de papel con el trazo del mundo (`menu-paper`, en `styles/product.css`), filas en negrita que se tintan al pasar, rótulos de… |
| [`ui/hover-card.tsx`](../ui/hover-card.tsx) | La ficha que se abre al pasar el ratón: el mismo panel de papel que un popover. |
| [`ui/input.tsx`](../ui/input.tsx) | El campo del mundo: el trazo de 3px sobre papel, la única tinta clara al enfocar. |
| [`ui/label.tsx`](../ui/label.tsx) | El rótulo de un campo: el rótulo de andén, en bloque, con medio renglón debajo. |
| [`ui/popover.tsx`](../ui/popover.tsx) | Un panel de papel con contenido, anclado a lo que lo abre; sin radio ni sombra. |
| [`ui/progress.tsx`](../ui/progress.tsx) | Una vía con el trazo del mundo que se rellena de tinta hasta donde llega el valor. |
| [`ui/select.tsx`](../ui/select.tsx) | El desplegable sobre Radix: el disparador es un campo del mundo con su chevrón, y las opciones un panel de papel con filas en negrita. |
| [`ui/separator.tsx`](../ui/separator.tsx) | El filete fino del mundo, en horizontal o en vertical. |
| [`ui/sheet.tsx`](../ui/sheet.tsx) | La hoja lateral: un pliego de papel que entra desde un borde de la pantalla, con el trazo del mundo en el canto que da a la página y la penumbra detrás. |
| [`ui/skeleton.tsx`](../ui/skeleton.tsx) | El hueco de carga: la forma de lo que viene, en la única tinta clara, quieto. |
| [`ui/sonner.tsx`](../ui/sonner.tsx) | Las notificaciones: un billete de papel con el trazo del mundo, sin sombra ni radio (el estilo va en `styles/site.css`, `[data-sonner-toast]`). |
| [`ui/switch.tsx`](../ui/switch.tsx) | El interruptor: una vía cuadrada con el trazo del mundo y un mando de tinta que la cruza; encendido, la vía se entinta y el mando pasa a papel. |
| [`ui/table.tsx`](../ui/table.tsx) | Una lista es una tabla de tarifas (`.fare`, en `styles/site.css`): el corte condensado con cifras tabulares, las cabeceras como rótulos de andén cerradas por el filete… |
| [`ui/tabs.tsx`](../ui/tabs.tsx) | Las pestañas son el riel de páginas del mundo: los destinos en negrita sobre un filete fino, el actual en tinta con la barra de 3px en el color de la línea que se viaja. |
| [`ui/textarea.tsx`](../ui/textarea.tsx) | El campo de varias líneas, con el trazo del mundo; lo mide su `rows`. |
| [`ui/tooltip.tsx`](../ui/tooltip.tsx) | La nota al pie de un control: tinta sobre papel, en el corte condensado, sin flecha ni radio. |
| [`worker/cookies.ts`](../worker/cookies.ts) | Lectura de cookies, y nada más. |
| [`worker/email.ts`](../worker/email.ts) | Email transaccional para las notificaciones de la plataforma. |
| [`worker/response.ts`](../worker/response.ts) | Las tres respuestas JSON que devuelve cualquier handler de Pages Functions. |

<!-- END generated:modules -->

## Configuración

<!-- BEGIN generated:config -->
<!-- No edites aquí: lo reescribe `npm run docs`. -->

_Sin `wrangler.toml`: este proyecto no se despliega por su cuenta._

### Bindings

_Nada que listar._

### Variables (`[vars]`, públicas)

_Nada que listar._

### Secretos

_Ninguno declarado en `wrangler.toml` ni en `.dev.vars.example`._

### Cron

_Sin cron propio._

### Scripts de npm

| Script | Comando |
| --- | --- |
| `npm run check:neutral` | `node scripts/check-neutral.mjs` |
| `npm run test` | `vitest run` |
| `npm run typecheck` | `tsc -p tsconfig.ui.json --noEmit && tsc -p tsconfig.worker.json --noEmit` |
| `npm run docs` | `node scripts/gen-docs.mjs` |
| `npm run docs:check` | `node scripts/gen-docs.mjs --check` |
| `npm run docs:gaps` | `node scripts/gen-docs.mjs --gaps` |

<!-- END generated:config -->
