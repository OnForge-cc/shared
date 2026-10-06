/**
 * Un documento de referencia en el mundo «Clear Sky» de noche: las condiciones
 * del programa de partners (`/programme`) y la documentación de developers
 * (`/docs`). Vive aquí para que los dos proyectos pinten el mismo documento.
 *
 * Una página, buscable de una vez, con un riel agrupado a la izquierda que dice
 * cuánto hay y dónde estás, y un riel a la derecha para la sección que lees. Un
 * lector que busca qué le pasa a su comisión con un reembolso, o dónde va el
 * `code_verifier`, quiere encontrar esa cláusula, no navegar hasta ella.
 *
 * Aquí vive todo lo que los dos documentos comparten: la maquetación, el
 * scroll spy, el filtro y los bloques que ambos usan (párrafo, subtítulo,
 * aviso, pasos y tabla). Cada proyecto pone su marcado en línea (sus rutas no
 * son las mismas) y sus bloques propios.
 */
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Info, Lightbulb, Search, TriangleAlert } from "lucide-react";

// ─── el vocabulario común ────────────────────────────────────────────────────

export type CalloutTone = "note" | "warning" | "tip";

export type CommonBlock =
	| { kind: "p"; text: string }
	| { kind: "h3"; id: string; text: string }
	| { kind: "callout"; tone: CalloutTone; title: string; text: string }
	| { kind: "steps"; items: { title: string; text: string }[] }
	| { kind: "table"; head: string[]; rows: string[][] };

export interface RefSection<B> {
	id: string;
	title: string;
	lead: string;
	blocks: B[];
}

export interface RefGroup<B> {
	label: string;
	sections: RefSection<B>[];
}

/** El `code` en línea y el enlace de la prosa, para el marcado de cada proyecto. */
export const INLINE_CODE = "rounded-[6px] bg-(--sk-mist) px-1.5 py-0.5 font-mono text-[0.85em] text-(--sk-ink)";
export const INLINE_LINK = "text-(--sk-accent) underline underline-offset-4 decoration-1 transition-colors hover:text-(--sk-ink)";

/** Un bloque de los que comparten los dos documentos. `inline` resuelve el marcado de cada proyecto. */
export function CommonBlockView({ block, inline }: { block: CommonBlock; inline: (text: string) => ReactNode }) {
	switch (block.kind) {
		case "p":
			return <p className="sk-body max-w-2xl text-[1rem]">{inline(block.text)}</p>;

		case "h3":
			return (
				<h3 id={block.id} className="group scroll-mt-36 pt-4 lg:scroll-mt-28">
					<a href={`#${block.id}`} className="sk-h3 text-[1.1875rem] no-underline">
						{block.text}
						{/* El ancla aparece al pasar el ratón: un ¶ permanente por el margen
						    es ruido, y ninguna ancla haría la cláusula imposible de enlazar. */}
						<span aria-hidden="true" className="ml-2 font-mono text-[0.875rem] text-(--sk-accent) opacity-0 transition-opacity group-hover:opacity-100">
							#
						</span>
					</a>
				</h3>
			);

		case "callout":
			return <Callout tone={block.tone} title={inline(block.title)} text={inline(block.text)} />;

		case "steps":
			return (
				<ol className="sk-card max-w-2xl divide-y divide-(--sk-hair)">
					{block.items.map((item, i) => (
						<li key={item.title} className="flex gap-4 px-5 py-4">
							{/* El número dice el orden en que se hace, no adorna. */}
							<span
								className="sk-num mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-(--sk-ground) text-[0.75rem] font-medium text-(--sk-ink) ring-1 ring-(--sk-hair-2)"
								aria-hidden="true">
								{i + 1}
							</span>
							<span className="min-w-0">
								<span className="block text-[0.9375rem] font-medium text-(--sk-ink)">{item.title}</span>
								<span className="sk-body mt-1 block text-[0.875rem]">{inline(item.text)}</span>
							</span>
						</li>
					))}
				</ol>
			);

		case "table":
			return (
				// Su propio scroll: una tabla ancha no debe mover la página de lado en un teléfono.
				<div className="sk-table-wrap max-w-2xl">
					<table className="sk-table min-w-[34rem]">
						<thead>
							<tr>
								{block.head.map((cell, i) => (
									<th key={i}>{cell}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{block.rows.map((row) => (
								<tr key={row[0]}>
									{row.map((cell, i) => (
										<td key={i} className={i === 0 ? "sk-strong" : undefined}>
											{inline(cell)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
	}
}

// En la noche el aviso lleva el ámbar (el único acento) como marco tenue; nada
// más de la página es ámbar, así que se lee como lo que va a costar algo.
const TONE: Record<CalloutTone, { icon: typeof Info; frame: string; mark: string }> = {
	note: { icon: Info, frame: "bg-(--sk-mist)", mark: "text-(--sk-accent)" },
	warning: { icon: TriangleAlert, frame: "bg-[rgba(244,166,64,0.12)] ring-1 ring-[rgba(244,166,64,0.35)]", mark: "text-(--sk-accent)" },
	tip: { icon: Lightbulb, frame: "bg-(--sk-surface) shadow-(--sk-shadow-1)", mark: "text-(--sk-ink-3)" },
};

/**
 * Tres tonos y ni uno más: `note` es lo que hay que entender, `warning` lo que
 * va a costar dinero o una tarde, `tip` lo que no hace falta pero se agradece.
 */
function Callout({ tone, title, text }: { tone: CalloutTone; title: ReactNode; text: ReactNode }) {
	const { icon: Icon, frame, mark } = TONE[tone];
	return (
		<div className={`max-w-2xl rounded-[14px] px-5 py-4 ${frame}`}>
			<p className="flex items-center gap-2 text-[0.9375rem] font-medium text-(--sk-ink)">
				<Icon className={`size-4 shrink-0 ${mark}`} strokeWidth={1.75} aria-hidden="true" />
				<span>{title}</span>
			</p>
			<p className="sk-body mt-1.5 text-[0.875rem]">{text}</p>
		</div>
	);
}

// ─── la página ───────────────────────────────────────────────────────────────

type Sub = { id: string; text: string };

function subheadings<B extends { kind: string }>(section: RefSection<B>): Sub[] {
	return section.blocks.flatMap((block) => {
		const b = block as { kind: string; id?: string; text?: string };
		return b.kind === "h3" && b.id && b.text ? [{ id: b.id, text: b.text }] : [];
	});
}

/**
 * El cuerpo del documento, entre su cabecera y el pie del marco: los dos
 * rieles, las secciones agrupadas y lo que vaya al final (`children`).
 */
export function Reference<B extends { kind: string }>({
	groups,
	label,
	filterLabel,
	renderBlock,
	children,
}: {
	groups: RefGroup<B>[];
	/** El nombre del índice para un lector de pantalla: «Programme», «Documentation». */
	label: string;
	filterLabel: string;
	renderBlock: (block: B) => ReactNode;
	children?: ReactNode;
}) {
	const sections = useMemo(() => groups.flatMap((g) => g.sections), [groups]);
	const anchors = useMemo(
		() => sections.flatMap((s) => [{ id: s.id, sectionId: s.id }, ...subheadings(s).map((h) => ({ id: h.id, sectionId: s.id }))]),
		[sections],
	);
	const [activeAnchor, setActiveAnchor] = useState(anchors[0]?.id ?? "");
	const [query, setQuery] = useState("");

	useEffect(() => {
		// Gana el título más cercano a lo alto del viewport, que es lo que quiere
		// decir «dónde estoy»: una proporción de IntersectionObserver dejaría
		// resaltada la sección anterior mientras su último párrafo siga en pantalla.
		const onScroll = () => {
			let current = anchors[0]?.id ?? "";
			for (const anchor of anchors) {
				const element = document.getElementById(anchor.id);
				if (element && element.getBoundingClientRect().top <= 140) current = anchor.id;
			}
			setActiveAnchor(current);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [anchors]);

	const activeSectionId = anchors.find((a) => a.id === activeAnchor)?.sectionId ?? sections[0]?.id;
	const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

	return (
		<section className="sk-wrap pt-10 md:pt-14">
			<MobileIndex sections={sections} activeSectionId={activeSectionId} label={label} />

			<div className="grid gap-x-12 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_12rem]">
				<SideNav
					groups={groups}
					label={label}
					filterLabel={filterLabel}
					query={query}
					onQuery={setQuery}
					activeSectionId={activeSectionId}
					activeAnchor={activeAnchor}
				/>

				<div className="min-w-0">
					<div className="flex flex-col gap-16">
						{groups.map((group) => (
							<div key={group.label} className="flex flex-col gap-16">
								{/* El rótulo del grupo una vez, como un filete a lo ancho de la
								    columna, y no como antetítulo sobre cada sección. */}
								<p className="border-b border-(--sk-hair) pb-2.5 text-[0.8125rem] font-medium text-(--sk-ink-3)">{group.label}</p>
								{group.sections.map((section) => (
									<section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-24">
										<h2 className="sk-h2 text-[1.75rem] md:text-[2.125rem]">{section.title}</h2>
										<p className="sk-body mt-3 max-w-2xl text-[1.0625rem]">{section.lead}</p>
										<div className="mt-8 flex flex-col gap-5">
											{section.blocks.map((block, i) => (
												<Fragment key={i}>{renderBlock(block)}</Fragment>
											))}
										</div>
									</section>
								))}
							</div>
						))}
						{children}
					</div>
				</div>

				{activeSection && <OnThisPage section={activeSection} activeAnchor={activeAnchor} />}
			</div>
		</section>
	);
}

/**
 * El índice en un teléfono: los dos rieles se ocultan por debajo de `lg`, y sin
 * esto el documento no tendría índice en el dispositivo donde más se lee. Una
 * fila de píldoras pegada bajo la cabecera (por eso las anclas bajan más en un
 * teléfono), que lleva la píldora activa a la vista mientras se lee.
 */
function MobileIndex<B>({ sections, activeSectionId, label }: { sections: RefSection<B>[]; activeSectionId?: string; label: string }) {
	const list = useRef<HTMLOListElement>(null);
	useEffect(() => {
		const ol = list.current;
		const pill = ol?.querySelector<HTMLElement>("a[aria-current]");
		if (!ol || !pill || ol.offsetParent === null) return;
		// A mano y no con scrollIntoView, que también movería la página en vertical.
		ol.scrollTo({ left: pill.offsetLeft - (ol.clientWidth - pill.offsetWidth) / 2, behavior: "smooth" });
	}, [activeSectionId]);
	return (
		<nav className="sk-onpage -mx-1 mb-8 lg:hidden" aria-label={`${label}: sections`}>
			<ol ref={list}>
				{sections.map((section) => (
					<li key={section.id}>
						<a href={`#${section.id}`} aria-current={section.id === activeSectionId ? "location" : undefined}>
							{section.title}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

/**
 * El riel de la izquierda: cada sección, agrupada, con un filtro sobre todas.
 * El filtro encuentra subtítulos además de títulos, así que teclear «refund» o
 * «pkce» encuentra la cláusula en vez de nada.
 */
function SideNav<B extends { kind: string }>({
	groups,
	label,
	filterLabel,
	query,
	onQuery,
	activeSectionId,
	activeAnchor,
}: {
	groups: RefGroup<B>[];
	label: string;
	filterLabel: string;
	query: string;
	onQuery: (value: string) => void;
	activeSectionId?: string;
	activeAnchor: string;
}) {
	const needle = query.trim().toLowerCase();
	const shown = groups
		.map((group) => ({
			label: group.label,
			sections: group.sections.filter(
				(s) =>
					!needle ||
					s.title.toLowerCase().includes(needle) ||
					s.lead.toLowerCase().includes(needle) ||
					subheadings(s).some((h) => h.text.toLowerCase().includes(needle)),
			),
		}))
		.filter((group) => group.sections.length > 0);

	return (
		<nav className="hidden lg:block" aria-label={label}>
			<div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6 pr-1">
				<div className="relative mb-6">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-(--sk-ink-3)" strokeWidth={1.75} aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(e) => onQuery(e.target.value)}
						placeholder="Filter"
						aria-label={filterLabel}
						className="sk-field min-h-10! py-2! pl-10! text-[0.875rem]!"
					/>
				</div>

				{shown.length === 0 ? (
					<p className="sk-small px-3">Nothing matches “{query.trim()}”.</p>
				) : (
					<div className="flex flex-col gap-6">
						{shown.map((group) => (
							<div key={group.label}>
								<p className="px-3 text-[0.8125rem] font-medium text-(--sk-ink)">{group.label}</p>
								<ul className="mt-1.5 space-y-0.5">
									{group.sections.map((section) => {
										const current = section.id === activeSectionId;
										const subs = subheadings(section);
										return (
											<li key={section.id}>
												<a
													href={`#${section.id}`}
													aria-current={current ? "location" : undefined}
													className={`block rounded-[10px] px-3 py-1.5 text-[0.875rem] leading-snug no-underline transition-colors ${
														current ? "bg-(--sk-mist) font-medium text-(--sk-ink)" : "text-(--sk-ink-2) hover:text-(--sk-ink)"
													}`}>
													{section.title}
												</a>
												{/* Sólo se despliega la sección en la que estás: todas a la vez
												    son treinta enlaces, ninguna no dice que una sección tiene partes. */}
												{current && subs.length > 0 && (
													<ul className="mb-1 mt-0.5 space-y-0.5">
														{subs.map((h) => (
															<li key={h.id}>
																<a
																	href={`#${h.id}`}
																	className={`block py-1 pl-6 pr-3 text-[0.8125rem] leading-snug no-underline transition-colors ${
																		h.id === activeAnchor ? "text-(--sk-ink)" : "text-(--sk-ink-3) hover:text-(--sk-ink)"
																	}`}>
																	{h.text}
																</a>
															</li>
														))}
													</ul>
												)}
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</div>
				)}
			</div>
		</nav>
	);
}

/**
 * El riel de la derecha: dónde estás dentro de la sección que lees. Sólo desde
 * `xl`, donde sobra ancho, y vacío en una sección sin subtítulos en vez de una
 * caja con un solo enlace a sí misma.
 */
function OnThisPage<B extends { kind: string }>({ section, activeAnchor }: { section: RefSection<B>; activeAnchor: string }) {
	const headings = subheadings(section);
	return (
		<aside className="hidden xl:block">
			{headings.length > 0 && (
				<div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6">
					<p className="text-[0.8125rem] font-medium text-(--sk-ink)">On this page</p>
					<ul className="mt-3 space-y-0.5 border-l border-(--sk-hair)">
						{headings.map((h) => {
							const current = h.id === activeAnchor;
							return (
								<li key={h.id}>
									<a
										href={`#${h.id}`}
										aria-current={current ? "location" : undefined}
										className={`-ml-px block border-l py-1 pl-3 text-[0.8125rem] leading-snug no-underline transition-colors ${
											current ? "border-(--sk-accent) text-(--sk-ink)" : "border-transparent text-(--sk-ink-3) hover:text-(--sk-ink)"
										}`}>
										{h.text}
									</a>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</aside>
	);
}
