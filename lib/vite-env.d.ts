/**
 * Las variables de build que lee el paquete (`import.meta.env`). Las consolas
 * traen `vite/client`, que declara lo mismo; aquí se repite para que el
 * paquete compruebe tipos por su cuenta, y las dos declaraciones se funden.
 */
interface ImportMetaEnv {
	/** El origen del control plane, fijado en el build de cada consola. */
	readonly VITE_PLATFORM_ORIGIN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
