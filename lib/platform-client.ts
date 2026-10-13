/**
 * Hablar con el control plane desde una consola que vive en otro origen
 * (admin., partners., developers. de la plataforma). Este módulo no tiene
 * autoridad: cada endpoint vuelve a decidir; aquí sólo se manda la cookie y se
 * lee el JSON.
 *
 * Funciona por tres cosas, y tienen que cumplirse las tres:
 *
 *  - la cookie de sesión es host-only del apex y el navegador la manda en un
 *    `fetch` same-site con `credentials: "include"`: las cookies se eligen por
 *    el host de la petición, no por el origen que la inicia;
 *  - `SameSite=Strict` lo permite, porque same-site se mide sobre el dominio
 *    registrable (`admin.onforge.cc → onforge.cc` es same-site), mientras que
 *    un sitio de terceros no lo es, y eso es lo que impide que
 *    `credentials: "include"` sea un agujero de CSRF;
 *  - el middleware del apex acepta este origen exacto (`consoleOrigins`, en
 *    `onforge/functions/_lib/cors.ts`) y responde con `Allow-Credentials`.
 *
 * Rompe cualquiera de ellas y todas las llamadas fallan como un error de CORS
 * opaco: si eso es lo que estás mirando, empieza por `consoleOrigins`.
 *
 * ── Dónde está la plataforma ─────────────────────────────────────────────────
 *
 * `VITE_PLATFORM_ORIGIN` en tiempo de build; sin él, el apex de producción, y
 * en localhost el puerto de `wrangler pages dev` de onforge (la API la sirven
 * sus Functions, que Vite no ejecuta). El literal de producción es el único
 * hostname escrito en las consolas: cuando la plataforma se mude de dominio,
 * cambia aquí y en el build.
 */

const PRODUCTION_ORIGIN = "https://onforge.cc";
const LOCAL_ORIGIN = "http://localhost:8788";

function isLocal(): boolean {
	if (typeof window === "undefined") return false;
	const host = window.location.hostname;
	return host === "localhost" || host === "127.0.0.1";
}

function configuredOrigin(): string | undefined {
	// `import.meta.env` escrito tal cual: el bundler (y vitest) lo sustituyen en
	// el código; detrás de un cast no lo reconocen y queda indefinido.
	return import.meta.env?.VITE_PLATFORM_ORIGIN;
}

/** El origen del control plane, sin barra final. */
export function platformOrigin(): string {
	return configuredOrigin() ?? (isLocal() ? LOCAL_ORIGIN : PRODUCTION_ORIGIN);
}

export function platformUrl(path: string): string {
	return `${platformOrigin()}${path}`;
}

/** Adónde mandar a quien necesita entrar, para que vuelva aquí después. */
export function signInUrl(returnTo: string = window.location.href): string {
	return platformUrl(`/auth/signin?return_to=${encodeURIComponent(returnTo)}`);
}

/**
 * Escrito a mano en vez de con una parameter property del constructor: las
 * consolas se compilan con `erasableSyntaxOnly`, que rechaza la sintaxis
 * exclusiva de TypeScript que emite código en tiempo de ejecución.
 */
export class ApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

/**
 * Un único envoltorio de fetch para toda la consola.
 *
 * Los errores llevan la propia cadena `error` del servidor: la API escribe
 * frases para quien se encontró el problema, y reformularlas en un componente
 * sólo las empeoraría. Un 403 se deja a quien llama: no es un fallo, es la
 * respuesta a «¿eres staff?», y la puerta pinta una página para él.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(platformUrl(path), { ...init, credentials: "include" });

	if (!res.ok) {
		let message = `Request failed (${res.status})`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) message = body.error;
		} catch {
			// Un cuerpo que no es JSON: el fallo ocurrió antes de que corriera el handler.
		}
		throw new ApiError(message, res.status);
	}

	return res.json() as Promise<T>;
}

export function jsonBody(value: unknown): RequestInit {
	return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

/**
 * Un archivo de la API como Blob, con la sesión: lo que una consola pinta en
 * una URL de blob (una foto de MMS) y no puede pedir con un `<img src>`, que no
 * manda credenciales a otro origen.
 */
export async function fetchBlob(path: string): Promise<Blob> {
	const res = await fetch(platformUrl(path), { credentials: "include" });
	if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
	return res.blob();
}

/**
 * Guardar un archivo que la API sólo entrega a alguien con sesión (un CSV de
 * ingresos). Un `<a href>` al apex no mandaría la cookie desde este origen y
 * volvería con un 401, así que se pide con credenciales, los bytes se vuelven
 * una URL de blob y se hace clic en ella; la URL se revoca justo después.
 */
export async function download(path: string, filename: string): Promise<void> {
	const res = await fetch(platformUrl(path), { credentials: "include" });
	if (!res.ok) {
		let message = `Download failed (${res.status})`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) message = body.error;
		} catch {
			// El fallo ocurrió antes del handler.
		}
		throw new ApiError(message, res.status);
	}
	const url = URL.createObjectURL(await res.blob());
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

/** Quién ha entrado, según el apex. */
export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: string;
	logo_url?: string | null;
}

/**
 * Restaura la sesión antes de pintar: el access token dura poco y uno caducado
 * es el estado normal de alguien que vuelve de comer, así que un 401 se sigue
 * de un refresh y, si falla, se abandona. Null significa que no ha entrado.
 */
export async function fetchMe(): Promise<AuthUser | null> {
	try {
		return (await api<{ user: AuthUser }>("/api/auth/me")).user;
	} catch {
		try {
			const refresh = await fetch(platformUrl("/api/auth/refresh"), { method: "POST", credentials: "include" });
			if (!refresh.ok) return null;
			return (await api<{ user: AuthUser }>("/api/auth/me")).user;
		} catch {
			return null;
		}
	}
}

/**
 * Salir: la sesión se cierra en el apex (borra las cookies y revoca la fila) y
 * la pestaña vuelve a la portada de la plataforma. Pase lo que pase con la
 * llamada, se navega: una sesión que no se pudo cerrar caduca sola.
 */
export async function signOutAndGo(): Promise<void> {
	try {
		await fetch(platformUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
	} catch {
		// Sin red o sin servidor: se navega igual.
	} finally {
		window.location.href = platformUrl("/");
	}
}
