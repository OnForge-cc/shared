/**
 * Las piezas de página del mundo de OnForge («Clear Sky» de noche), compartidas
 * por el sitio de onforge y las páginas públicas de partners y developers: la
 * cabecera de página con su cielo, el encabezado de sección, el aro de icono,
 * el recorrido en pasos, las preguntas, el control segmentado y el cierre. Las
 * mismas formas que `ondesk/src/features/frontend/sky/page.tsx`.
 *
 * Sin edición ni sesión dentro: reciben hrefs y etiquetas ya resueltos. onforge
 * los envuelve (`features/frontend/sky/page.tsx`) para pasar los enlaces por su
 * edición y elegir la acción del cierre según la sesión; el precio (`SkPrice`)
 * vive allí, que es donde hay página de precios.
 *
 * Reglas que estas piezas ya cumplen y que una página no debe deshacer: sin
 * antetítulos sobre los titulares (el titular habla solo), sin ordinales como
 * adorno, el ámbar como único acento, el verde sólo para `live`, vidrio sólo
 * sobre el cielo.
 */
import { useRef, useState, type ComponentType } from "react";
import { ChevronDown } from "lucide-react";
import { useNarrow } from "./hooks";
import { SkyCanvas } from "./sky-canvas";
import { SkArrow, SkButton } from "./kit";

/**
 * Un icono de lucide, tipado por su forma y no por la clase del paquete: cada
 * consola trae su propia copia de lucide-react y la de este paquete es otra
 * instancia para TypeScript, aunque el bundle deduplique las dos en una.
 */
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean | "true" | "false" }>;

// ─── la cabecera de página ───────────────────────────────────────────────────

/**
 * La cabecera de una página interior: el cielo nocturno con su mar de nubes
 * abajo, el titular y la entradilla a la izquierda. Con `core`, el núcleo ocupa
 * la derecha y despliega solo; con `aside`, otra cosa ocupa ese sitio.
 * `children` va debajo de la entradilla: botones, una nota.
 */
export function PageHero({
	title,
	lead,
	children,
	core,
	aside,
}: {
	title: React.ReactNode;
	lead?: React.ReactNode;
	children?: React.ReactNode;
	core?: boolean;
	aside?: React.ReactNode;
}) {
	const anchor = useRef<HTMLDivElement>(null);
	const narrow = useNarrow();
	const [noGl, setNoGl] = useState(false);
	const split = Boolean(core || aside);

	return (
		<section className="sk-page-hero">
			<div className="sk-hero-sky absolute inset-0" aria-hidden="true" />
			{!noGl && (
				<SkyCanvas
					planet={core ? anchor : undefined}
					horizon={narrow ? 0.88 : split ? 0.8 : 0.72}
					fade={[0, 1]}
					quality={core ? 1 : 0.6}
					onUnsupported={() => setNoGl(true)}
				/>
			)}
			<div className={`sk-wrap relative grid items-center gap-y-6 pb-20 pt-14 md:pb-28 md:pt-20 ${split ? "lg:grid-cols-12 lg:gap-x-10" : ""}`}>
				<div className={split ? "lg:col-span-7" : "max-w-3xl"}>
					<h1 className={`sk-display sk-rise text-[2.5rem] sm:text-[3.25rem] ${split ? "lg:text-[3.25rem]" : "lg:text-[3.75rem]"}`}>{title}</h1>
					{lead && (
						<p className="sk-body sk-rise mt-6 max-w-2xl text-[1.0625rem] md:text-lg" style={{ "--i": 1 } as React.CSSProperties}>
							{lead}
						</p>
					)}
					{children && (
						<div className="sk-rise mt-8" style={{ "--i": 2 } as React.CSSProperties}>
							{children}
						</div>
					)}
				</div>
				{core && (
					<div className="lg:col-span-5">
						<div ref={anchor} className="relative mx-auto -my-4 aspect-square w-full max-w-72 lg:my-0 lg:max-w-none">
							{noGl && <div className="sk-orb absolute left-1/2 top-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2" />}
						</div>
					</div>
				)}
				{!core && aside && (
					<div className="sk-rise lg:col-span-5" style={{ "--i": 2 } as React.CSSProperties}>
						{aside}
					</div>
				)}
			</div>
		</section>
	);
}

// ─── el encabezado de sección ────────────────────────────────────────────────

/**
 * Una sección del marketing: titular, entradilla opcional debajo (nunca a un
 * lado) y un enlace opcional, con el href tal cual se lo dan. El espaciado
 * vertical entre secciones vive aquí.
 */
export function Section({
	id,
	title,
	lead,
	action,
	children,
	className = "",
}: {
	id?: string;
	title?: React.ReactNode;
	lead?: React.ReactNode;
	action?: { href: string; label: string };
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<section id={id} className={`sk-wrap scroll-mt-20 pt-20 md:pt-28 ${className}`}>
			{title && <h2 className="sk-h2 max-w-3xl text-[2rem] md:text-[2.75rem]">{title}</h2>}
			{lead && <p className="sk-body mt-4 max-w-2xl text-[1.0625rem]">{lead}</p>}
			{action && (
				<a href={action.href} className="sk-link mt-4 text-[0.9375rem]">
					{action.label} <SkArrow />
				</a>
			)}
			{children && <div className={title || lead || action ? "mt-10 md:mt-12" : ""}>{children}</div>}
		</section>
	);
}

// ─── marcadores ──────────────────────────────────────────────────────────────

/** Un icono dentro de un círculo: de vidrio sólo donde flota sobre el cielo; sobre el suelo, un aro de línea. */
export function Bead({ icon: Icon, size = "md", variant = "line" }: { icon: IconComponent; size?: "md" | "lg"; variant?: "glass" | "line" }) {
	return (
		<span
			className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--sk-ink) ${
				variant === "glass" ? "sk-glass" : "bg-(--sk-mist) ring-1 ring-(--sk-hair)"
			} ${size === "lg" ? "size-12" : "size-10"}`}
			aria-hidden="true">
			<Icon className={size === "lg" ? "size-5" : "size-[18px]"} strokeWidth={1.6} />
		</span>
	);
}

/** Un recorrido en pasos: aros unidos por una órbita punteada. Los pasos se nombran por lo que hacen. */
export function StepList({ steps }: { steps: { icon: IconComponent; title: string; desc: React.ReactNode }[] }) {
	// Cinco pasos no caben en cinco columnas hasta `lg`: antes van de dos en dos y
	// la órbita, que sólo une una fila, se calla.
	const wide = steps.length >= 5;
	const cols = wide ? "sm:grid-cols-2 lg:grid-cols-5" : steps.length === 4 ? "md:grid-cols-4" : steps.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
	return (
		<ol className={`relative grid gap-10 md:gap-8 ${cols}`}>
			<span className={`sk-orbit-line absolute left-6 right-12 top-6 hidden h-px ${wide ? "lg:block" : "md:block"}`} aria-hidden="true" />
			{steps.map((step) => (
				<li key={step.title} className="relative">
					<Bead icon={step.icon} size="lg" />
					<h3 className="sk-h3 mt-6 text-[1.125rem]">{step.title}</h3>
					<p className="sk-body mt-2 max-w-sm text-[0.9375rem]">{step.desc}</p>
				</li>
			))}
		</ol>
	);
}

// ─── preguntas ───────────────────────────────────────────────────────────────

/** Preguntas desplegables dentro de una tarjeta. */
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
	return (
		<div className="sk-faq sk-card">
			{items.map((item) => (
				<details key={item.q}>
					<summary>
						{item.q}
						<ChevronDown className="sk-chevron size-4" strokeWidth={1.75} aria-hidden="true" />
					</summary>
					<div className="sk-answer">{item.a}</div>
				</details>
			))}
		</div>
	);
}

// ─── controles ───────────────────────────────────────────────────────────────

/** Un control segmentado: un riel oscuro, la opción elegida en hielo. */
export function Segmented<T extends string>({
	value,
	options,
	onChange,
	label,
}: {
	value: T;
	options: { value: T; label: React.ReactNode }[];
	onChange: (v: T) => void;
	label: string;
}) {
	return (
		<div role="group" aria-label={label} className="sk-segment">
			{options.map((option) => (
				<button key={option.value} type="button" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
					{option.label}
				</button>
			))}
		</div>
	);
}

// ─── el cierre ───────────────────────────────────────────────────────────────

/**
 * El cierre de cada página: un panel con el cielo vivo, el titular y las dos
 * acciones. Quien lo monta decide la primaria (onforge la cambia con la sesión).
 */
export function Closing({
	headline,
	desc,
	primary: main,
	secondary,
}: {
	headline: React.ReactNode;
	desc?: React.ReactNode;
	primary: { href: string; label: string };
	secondary?: { href: string; label: string };
}) {
	const [noGl, setNoGl] = useState(false);

	return (
		<section className="sk-wrap pb-6 pt-20 md:pt-28">
			<div className="sk-panel relative">
				<div className="sk-hero-sky absolute inset-0" aria-hidden="true" />
				{!noGl && <SkyCanvas horizon={0.62} quality={0.7} onUnsupported={() => setNoGl(true)} />}
				<div className="relative max-w-2xl px-6 py-16 sm:px-12 md:py-24 lg:px-16">
					<h2 className="sk-h2 text-[2.25rem] md:text-[3.25rem]">{headline}</h2>
					{desc && <p className="sk-body mt-5 max-w-lg text-[1.0625rem]">{desc}</p>}
					<div className="mt-9 flex flex-wrap items-center gap-2">
						<SkButton href={main.href}>
							{main.label} <SkArrow />
						</SkButton>
						{secondary && (
							<SkButton href={secondary.href} variant="glass">
								{secondary.label}
							</SkButton>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
