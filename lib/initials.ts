/**
 * Dos letras en lugar de alguien que todavía no tiene avatar.
 *
 * Va cayendo de nombre → email → "?", y parte por los puntos y la @ además de por
 * los espacios, porque muchas cuentas son `ana.perez@…` con un campo de nombre
 * que nadie rellenó — y «AN» sacado de un email es mejor que «?» sacado de un
 * nombre vacío.
 *
 * Es la única implementación: cualquier pantalla que necesite un monograma
 * importa `@onforge/shared/lib/initials`.
 */
export function initialsOf(name: string | undefined | null, email?: string | undefined | null): string {
	const source = (name ?? "").trim() || email || "?";
	return source
		.split(/[\s@.]+/)
		.filter(Boolean)
		.map((word) => word[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}
