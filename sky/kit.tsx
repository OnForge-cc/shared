/**
 * Las piezas del mundo de OnForge («Clear Sky» de noche): la marca, la píldora
 * y la flecha. Mismas formas que el kit de ondesk.cc; la marca es la de OnForge.
 */
import { useId } from "react";
import { ArrowRight } from "lucide-react";

/**
 * La marca: un núcleo con fuego dentro, su órbita y un despliegue en ella.
 * Geometría pura: un círculo, una elipse y un punto. La mitad de la órbita que
 * pasa por delante se vuelve a trazar encima del núcleo, así la de detrás queda
 * oculta por él.
 */
export function Mark({ className = "size-6" }: { className?: string }) {
	// useId trae caracteres que una referencia url(#…) de SVG no admite.
	const id = `fm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
	return (
		<svg viewBox="0 0 28 28" className={className} aria-hidden="true">
			<defs>
				<radialGradient id={`${id}-c`} cx="0.42" cy="0.4" r="0.62">
					<stop offset="0" stopColor="#fff4de" />
					<stop offset="0.45" stopColor="#f7b04f" />
					<stop offset="1" stopColor="#b8541a" />
				</radialGradient>
			</defs>
			<g transform="rotate(-16 14 14)">
				<ellipse cx="14" cy="14" rx="12.6" ry="4.3" fill="none" stroke="#9fb0cc" strokeOpacity="0.55" strokeWidth="1.15" />
			</g>
			<circle cx="14" cy="14" r="7.4" fill={`url(#${id}-c)`} />
			<g transform="rotate(-16 14 14)">
				<path d="M1.4 14 A12.6 4.3 0 0 0 26.6 14" fill="none" stroke="#c9d6ea" strokeOpacity="0.85" strokeWidth="1.15" />
			</g>
			<circle cx="24.6" cy="11.1" r="2.2" fill="#eaf0fa" />
		</svg>
	);
}

/** La marca con su nombre. */
export function Wordmark({ href, className = "" }: { href: string; className?: string }) {
	return (
		<a
			href={href}
			className={`inline-flex items-center gap-2 rounded-full -ml-1 px-1 py-1 text-[1.125rem] font-semibold tracking-[-0.03em] text-(--sk-ink) no-underline ${className}`}>
			<Mark />
			OnForge
		</a>
	);
}

export function SkArrow({ className = "size-4" }: { className?: string }) {
	return <ArrowRight className={`sk-arrow shrink-0 ${className}`} strokeWidth={1.75} aria-hidden="true" />;
}

/** Una píldora como enlace. `primary` (de hielo) es la única acción primaria de cada vista. */
export function SkButton({
	href,
	children,
	variant = "primary",
	size = "md",
	className = "",
}: {
	href: string;
	children: React.ReactNode;
	variant?: "primary" | "quiet" | "glass";
	size?: "md" | "sm";
	className?: string;
}) {
	return (
		<a href={href} className={`sk-btn sk-btn--${variant} ${size === "sm" ? "sk-btn--sm" : ""} ${className}`}>
			{children}
		</a>
	);
}
