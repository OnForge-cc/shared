/**
 * El documento entero es de noche mientras se ve una página de Clear Sky: el
 * fondo de `<html>` (lo que asoma en el rebote del scroll) y el color de la
 * barra del navegador. Lo devuelve como estaba al salir. Lo llaman el marco
 * del sitio de onforge y el marco de consola de las tres SPAs.
 */
import { useEffect } from "react";

export const NIGHT = "#070c18";

export function useNightDocument(): void {
	useEffect(() => {
		const root = document.documentElement;
		const previous = root.style.backgroundColor;
		const meta = document.querySelector('meta[name="theme-color"]');
		const previousTheme = meta?.getAttribute("content") ?? null;
		root.style.backgroundColor = NIGHT;
		meta?.setAttribute("content", NIGHT);
		return () => {
			root.style.backgroundColor = previous;
			if (meta && previousTheme) meta.setAttribute("content", previousTheme);
		};
	}, []);
}
