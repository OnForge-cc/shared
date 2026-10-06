/**
 * Hooks de scroll y de montaje contra los que se animan las páginas de Clear Sky,
 * y los tres que usan las piezas de consola de `console.tsx` (`useFlash`,
 * `useDismiss`, `useScrollToStop`). Compartidos por onforge, admin, partners y
 * developers; el único hook que dependía de la edición (`useLocalizedHref`) se
 * quedó en onforge, que es el único que tiene ediciones.
 *
 * Un módulo propio en vez de vivir junto a los componentes: Fast Refresh sólo
 * vuelve a renderizar un archivo que exporta componentes y nada más, y una
 * recarga completa en cada cambio de texto es justo lo que el servidor de
 * desarrollo está para evitar.
 */
import { useCallback, useState, useEffect, useRef, type RefObject } from "react";

/**
 * El reloj del horario en milisegundos, leído de `--clock` en `.site` para que
 * ningún intervalo de JavaScript pueda desviarse del que usa el CSS. 12 s si
 * todavía no hay DOM.
 */
export function useClockMs(): number {
	// `--clock` también está declarado en `:root` (site.css) precisamente para
	// poder leerlo antes de que exista ningún `.site` en el DOM.
	const [ms] = useState(() => {
		if (typeof document === "undefined") return 12000;
		const raw = getComputedStyle(document.documentElement).getPropertyValue("--clock").trim();
		const value = parseFloat(raw);
		if (!Number.isFinite(value) || value <= 0) return 12000;
		return raw.endsWith("ms") ? value : value * 1000;
	});
	return ms;
}

/**
 * Un aviso que se enciende y se apaga solo: el «Saved.» junto al botón de un
 * panel. Dura un tercio del reloj (4 s) y un segundo guardado lo reinicia.
 */
export function useFlash(): [boolean, () => void] {
	const clock = useClockMs();
	const [on, setOn] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const flash = useCallback(() => {
		setOn(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setOn(false), clock / 3);
	}, [clock]);

	return [on, flash];
}

/**
 * Cierra un panel flotante (menú, selector) con un clic fuera o con Escape, y
 * devuelve el foco al botón que lo abrió cuando se cierra con el teclado.
 */
export function useDismiss(
	open: boolean,
	container: RefObject<HTMLElement | null>,
	trigger: RefObject<HTMLElement | null>,
	close: () => void,
): void {
	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (container.current && !container.current.contains(e.target as Node)) close();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close();
				trigger.current?.focus();
			}
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, container, trigger, close]);
}

/**
 * Lleva a la parada que nombra la URL una vez que existe: `#members` o, para
 * una ruta vieja que ahora es una parada de otra hoja, la que se pasa como
 * `fallback`. El navegador no puede hacerlo solo porque la parada aún no está
 * pintada cuando carga la página.
 */
export function useScrollToStop(ready: boolean, fallback?: string): void {
	const done = useRef(false);
	useEffect(() => {
		if (!ready || done.current) return;
		const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
		const id = hash || fallback;
		if (!id) return;
		done.current = true;
		requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
	}, [ready, fallback]);
}

/** `true` por debajo de la anchura dada; se reevalúa al redimensionar. */
export function useNarrow(query = "(max-width: 47.9rem)"): boolean {
	const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
	useEffect(() => {
		const mq = window.matchMedia(query);
		const onChange = () => setNarrow(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [query]);
	return narrow;
}

/** Se dispara una vez cuando el elemento observado entra en el viewport. */
export function useInView() {
	const ref = useRef<HTMLElement>(null);
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);
	return { ref, inView };
}

/** Anima un número de 0 → target en cuanto `active` pasa a true. */
export function useCounter(target: number, duration = 1200, active = false) {
	const [value, setValue] = useState(0);
	useEffect(() => {
		if (!active) return;
		let current = 0;
		const step = target / (duration / 16);
		const id = setInterval(() => {
			current += step;
			if (current >= target) {
				setValue(target);
				clearInterval(id);
			} else {
				setValue(Math.floor(current));
			}
		}, 16);
		return () => clearInterval(id);
	}, [target, duration, active]);
	return value;
}

/**
 * Devuelve true tras el primer frame de animación — se usa para las transiciones
 * de entrada al montar.
 */
export function useMountVisible() {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(id);
	}, []);
	return visible;
}
