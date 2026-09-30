/**
 * Las piezas pequeñas del mapa que comparten las apps de OnForge. Hoy sólo
 * queda `AppLine`, el tramo de color junto a un nombre.
 */
import type { CSSProperties } from "react";

/** El tramo de una línea junto a su nombre: cómo se nombra un elemento en una fila. */
export function AppLine({ color, name, className = "" }: { color?: string; name: string; className?: string }) {
	return (
		<span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
			<span className="swatch" style={{ "--swatch": color ?? "var(--ink)", width: "1.25rem" } as CSSProperties} aria-hidden="true" />
			<span className="min-w-0 truncate font-bold">{name}</span>
		</span>
	);
}
