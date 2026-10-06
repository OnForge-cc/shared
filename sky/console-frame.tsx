/**
 * El marco de consola de admin, partners y developers, en el mundo «Clear Sky»
 * de noche: la forma de una app de trabajo, la misma que la consola de onforge.
 *
 * - A la izquierda, la barra lateral: la marca con el nombre de la consola, sus
 *   destinos (con un icono y, si hace falta, un estado: «3 past due») y, abajo,
 *   los enlaces que salen a la plataforma. Fija mientras la página se mueve; en
 *   un teléfono es un cajón.
 * - Arriba, la barra: el rastro y el menú de cuenta. Se vuelve vidrio cuando la
 *   página se desplaza. `banner` va encima de todo (la franja del staff de
 *   admin, que dice en qué consola estás mientras miras la cuenta de otro).
 * - En el centro, la página, en una columna de 74rem sobre la noche.
 *
 * Vive en `@onforge/shared` y cada consola le pasa sus destinos. La raíz lleva
 * `site sk` para que el vocabulario del mapa que aún escriben las vistas se
 * pinte en la noche (bloque de consola de `styles/sky.css`). Mientras se ve, el
 * documento entero es de noche (`useNightDocument`).
 *
 * Salir: un enlace de cuenta con `href: "#signout"` cierra la sesión en el apex
 * (`signOutAndGo`) en vez de navegar; así ninguna consola necesita su propia
 * ruta de salida.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, X, type LucideIcon } from "lucide-react";
import { signOutAndGo } from "../lib/platform-client";
import { Monogram } from "./console";
import { useDismiss } from "./hooks";
import { Mark } from "./kit";
import { useNightDocument } from "./night";

export interface FrameCrumb {
	label: string;
	to?: LinkProps["to"];
}

export interface FrameNavItem {
	to: LinkProps["to"];
	label: string;
	icon: LucideIcon;
	/** Activo sólo en la ruta exacta (la portada, que sería prefijo de todas). */
	exact?: boolean;
	/** Un estado con su palabra junto al destino: «3 past due». */
	badge?: ReactNode;
}

export interface FrameLink {
	href: string;
	label: string;
	icon: LucideIcon;
}

export interface FrameAccount {
	name: string;
	email: string;
	logoUrl?: string | null;
	/** Las filas del menú de cuenta; la última suele ser «Sign out» (`href: "#signout"`). */
	links: { label: string; href: string }[];
}

export const SIGN_OUT = "#signout";

export function ConsoleFrame({
	brand,
	product = "OnForge",
	homeTo,
	nav,
	links = [],
	linksHeading,
	banner,
	account,
	topRight,
	crumbs,
	statusHref,
	legalHref,
	children,
}: {
	/** El nombre de la consola junto a la marca: «Admin», «Partners», «Developers». */
	brand: string;
	/** El nombre de la plataforma delante del de la consola. */
	product?: string;
	homeTo: LinkProps["to"];
	nav: FrameNavItem[];
	links?: FrameLink[];
	/** El rótulo sobre los enlaces de salida; por defecto, el nombre de la plataforma. */
	linksHeading?: string;
	banner?: ReactNode;
	account?: FrameAccount | null;
	/** Lo que va arriba a la derecha sin sesión («Sign in»). */
	topRight?: ReactNode;
	crumbs?: FrameCrumb[];
	/** Los dos enlaces del pie, en el apex de la plataforma. */
	statusHref: string;
	legalHref: string;
	children: ReactNode;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [scrolled, setScrolled] = useState(false);
	const sentinel = useRef<HTMLDivElement>(null);
	// El cajón recuerda en qué página se abrió: al navegar queda cerrado solo.
	const [drawerAt, setDrawerAt] = useState<string | null>(null);
	const drawerOpen = drawerAt === pathname;
	useNightDocument();

	useEffect(() => {
		const el = sentinel.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
		io.observe(el);
		return () => io.disconnect();
	}, []);

	useEffect(() => {
		if (!drawerOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setDrawerAt(null);
		};
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			document.removeEventListener("keydown", onKey);
		};
	}, [drawerOpen]);

	const sidebar = <FrameSidebar brand={brand} product={product} homeTo={homeTo} nav={nav} links={links} linksHeading={linksHeading ?? product} pathname={pathname} />;

	return (
		<div className="site sk relative min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
			<div ref={sentinel} className="pointer-events-none absolute inset-x-0 top-0 h-2" aria-hidden="true" />

			<aside className="sk-sidebar sticky top-0 hidden h-dvh flex-col overflow-y-auto px-3 pb-4 pt-4 lg:flex">{sidebar}</aside>

			<div className="flex min-h-dvh min-w-0 flex-col">
				{banner}
				<header className="sk-header sticky top-0 z-40" data-scrolled={scrolled || drawerOpen}>
					<div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
						<span className="-ml-2 lg:hidden">
							<button
								type="button"
								className="sk-navlink size-10! justify-center p-0!"
								onClick={() => setDrawerAt(drawerOpen ? null : pathname)}
								aria-expanded={drawerOpen}
								aria-label={drawerOpen ? "Close the menu" : "Open the menu"}>
								{drawerOpen ? <X className="size-5" strokeWidth={1.75} /> : <Menu className="size-5" strokeWidth={1.75} />}
							</button>
						</span>
						<span className="lg:hidden">
							<Link to={homeTo} className="inline-flex items-center gap-2 text-[1.0625rem] font-semibold tracking-[-0.03em] text-(--sk-ink) no-underline">
								<Mark className="size-5" />
								{product} <span className="font-normal text-(--sk-ink-3)">{brand}</span>
							</Link>
						</span>

						{crumbs && crumbs.length > 0 && <FrameCrumbs crumbs={crumbs} />}

						<div className="ml-auto flex items-center gap-2">
							{topRight}
							{account && <FrameAccountMenu account={account} />}
						</div>
					</div>
				</header>

				<main className="relative flex-1 px-4 pb-20 pt-4 sm:px-6 lg:px-10 lg:pt-6">
					<div className="mx-auto flex w-full max-w-[74rem] flex-col gap-6">{children}</div>
				</main>

				<footer className="px-4 pb-6 sm:px-6 lg:px-10">
					<div className="mx-auto flex w-full max-w-[74rem] flex-wrap items-center justify-between gap-3 border-t border-(--sk-hair) pt-5">
						<span className="sk-small">
							© {new Date().getFullYear()} {product} {brand}. Northstar Platforms LLC
						</span>
						<span className="flex gap-4">
							<a href={statusHref} className="sk-small no-underline hover:text-(--sk-ink)">
								Status
							</a>
							<a href={legalHref} className="sk-small no-underline hover:text-(--sk-ink)">
								Legal
							</a>
						</span>
					</div>
				</footer>
			</div>

			{drawerOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						aria-label="Close the menu"
						className="absolute inset-0 bg-[rgba(3,8,20,0.6)] backdrop-blur-[2px]"
						onClick={() => setDrawerAt(null)}
					/>
					<aside className="sk-sheet sk-sidebar absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col overflow-y-auto px-3 pb-4 pt-4 shadow-(--sk-shadow-3)">
						{sidebar}
					</aside>
				</div>
			)}
		</div>
	);
}

function FrameSidebar({
	brand,
	product,
	homeTo,
	nav,
	links,
	linksHeading,
	pathname,
}: {
	brand: string;
	product: string;
	homeTo: LinkProps["to"];
	nav: FrameNavItem[];
	links: FrameLink[];
	linksHeading: string;
	pathname: string;
}) {
	return (
		<>
			<Link to={homeTo} className="mb-5 inline-flex items-center gap-2 px-2 text-[1.0625rem] font-semibold tracking-[-0.03em] text-(--sk-ink) no-underline">
				<Mark />
				{product} <span className="font-normal text-(--sk-ink-3)">{brand}</span>
			</Link>
			<nav aria-label={brand} className="flex flex-col gap-0.5">
				{nav.map(({ to, label, icon: Icon, exact, badge }) => {
					const path = String(to);
					const active = exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
					return (
						<Link
							key={path}
							to={to}
							aria-current={active ? "page" : undefined}
							className={`sk-sidelink flex h-9 items-center gap-3 rounded-[10px] px-3 text-[0.875rem] no-underline transition-colors duration-150 ${
								active ? "is-active font-medium text-(--sk-ink)" : "text-(--sk-ink-2) hover:text-(--sk-ink)"
							}`}>
							<Icon className={`size-4 shrink-0 ${active ? "text-(--sk-ink)" : "text-(--sk-ink-3)"}`} strokeWidth={1.75} aria-hidden="true" />
							<span className="min-w-0 flex-1 truncate">{label}</span>
							{badge}
						</Link>
					);
				})}
			</nav>
			{links.length > 0 && (
				<div className="mt-auto pt-6">
					<p className="sk-small px-3 pb-1.5 font-medium">{linksHeading}</p>
					<ul className="flex flex-col gap-0.5">
						{links.map(({ href, label, icon: Icon }) => (
							<li key={href}>
								<a
									href={href}
									className="sk-sidelink flex h-9 items-center gap-3 rounded-[10px] px-3 text-[0.875rem] text-(--sk-ink-2) no-underline transition-colors duration-150 hover:text-(--sk-ink)">
									<Icon className="size-4 shrink-0 text-(--sk-ink-3)" strokeWidth={1.75} aria-hidden="true" />
									<span className="min-w-0 flex-1 truncate">{label}</span>
									<ArrowUpRight className="size-3.5 text-(--sk-ink-3)" strokeWidth={1.75} aria-hidden="true" />
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</>
	);
}

function FrameCrumbs({ crumbs }: { crumbs: FrameCrumb[] }) {
	return (
		<nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
			<ol className="flex min-w-0 items-center gap-1.5 text-[0.875rem] text-(--sk-ink-3)">
				{crumbs.map((crumb, i) => {
					const last = i === crumbs.length - 1;
					return (
						<li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
							{i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden="true" />}
							{crumb.to && !last ? (
								<Link to={crumb.to} className="truncate no-underline hover:text-(--sk-ink)">
									{crumb.label}
								</Link>
							) : (
								<span aria-current={last ? "page" : undefined} className={`truncate ${last ? "font-medium text-(--sk-ink)" : ""}`}>
									{crumb.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

/** El menú de cuenta: la cara de quien ha entrado, que abre un menú de vidrio. */
function FrameAccountMenu({ account }: { account: FrameAccount }) {
	const [open, setOpen] = useState(false);
	const box = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	useDismiss(open, box, trigger, () => setOpen(false));

	return (
		<div ref={box} className="relative">
			<button
				ref={trigger}
				type="button"
				className="flex items-center gap-2 rounded-full p-1 pr-2.5 transition-colors hover:bg-(--sk-mist)"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={`Your account, ${account.name}`}>
				<Monogram name={account.name} logoUrl={account.logoUrl} size="sm" />
				<ChevronDown className={`size-3.5 shrink-0 text-(--sk-ink-3) transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden="true" />
			</button>
			{open && (
				<div role="menu" aria-label="Your account" className="menu-panel right-0 top-full mt-2 w-72">
					<div className="flex items-center gap-3 px-3 pb-3 pt-2">
						<Monogram name={account.name} logoUrl={account.logoUrl} size="sm" />
						<div className="min-w-0">
							<p className="truncate font-medium text-(--sk-ink)">{account.name}</p>
							<p className="sk-small truncate">{account.email}</p>
						</div>
					</div>
					<div className="border-t border-(--sk-hair) pt-1">
						{account.links.map((link) =>
							link.href === SIGN_OUT ? (
								<a
									key={link.href}
									role="menuitem"
									href={link.href}
									onClick={(e) => {
										e.preventDefault();
										void signOutAndGo();
									}}>
									{link.label}
								</a>
							) : (
								<a key={link.href} role="menuitem" href={link.href}>
									{link.label}
								</a>
							),
						)}
					</div>
				</div>
			)}
		</div>
	);
}
