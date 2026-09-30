# @onforge/shared

Contiene el código común de las apps de OnForge: la UI (`ui/`, `components/`, con
el mundo del mapa de red en `styles/`), el cliente CRUD y sus hooks (`lib/`,
`hooks/`) y los helpers de worker `worker/response`, `worker/email` y
`worker/cookies`. Envía **TypeScript crudo**: no hay paso de build; el bundler de
la app que lo consume lo compila y su `tsc` lo comprueba. Es un fork de
`@ondesk/shared` sin presencia, llamadas, SSO de producto ni las seis líneas.
El índice de módulos está en [`docs/README.md`](docs/README.md) y se regenera con
`npm run docs`.

**El pin es a un TAG, no a master.** Una app lo consume con un tag (o, en
desarrollo local, con `"@onforge/shared": "file:../shared"`) y sube cuando quiere.
Publicar es `npm run typecheck`, subir `version` en `package.json`, commit y
`git tag vX.Y.Z && git push --tags`; un commit empujado sin tag rompe el CI de
quien apunta a master. Las dependencias de runtime son `peerDependencies`, y
Tailwind v4 necesita `@source "../node_modules/@onforge/shared";` en el
`index.css` de cada app.
