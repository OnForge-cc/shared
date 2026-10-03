#!/usr/bin/env node
/**
 * La regla de marca hecha test: OnForge no nombra a su proveedor de
 * infraestructura. Dos reglas:
 *
 *   everywhere → el nombre del proveedor, en cualquier archivo de texto.
 *   customer   → además los nombres de sus productos, en las rutas que ve un
 *                cliente (las lista `customer` en neutral.config.json).
 *
 * Pasan los identificadores que impone la herramienta (paquetes, módulos, URLs
 * de API, variables que lee wrangler), las líneas con `neutral:allow-line` y los
 * bloques entre `neutral:allow-start` y `neutral:allow-end`, que son sólo los
 * legales que la ley obliga a escribir. Este archivo es idéntico en los cuatro
 * repos; cada uno trae su `neutral.config.json`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".wrangler", "graphify-out", "coverage", ".superpowers"]);
const SKIP_FILES = new Set(["package-lock.json", "check-neutral.mjs", "neutral.config.json"]);
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|sql|toml|ya?ml|txt|xml|svg|example|gitignore)$/i;

const EVERYWHERE = /cloudflare/i;
const CUSTOMER =
	/\b(workers?|D1|R2|durable objects?|workerd|wrangler|nodejs_compat|compatibility_(date|flags))\b|workers\.dev|pages\.dev|_cf-custom-hostname/i;

const TOOLCHAIN = [
	/@cloudflare\/[a-z0-9-]+/gi,
	/cloudflare:[a-z*]+/gi,
	/(api|dash)\.cloudflare\.com/gi,
	/CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)/g,
	/cloudflare\/wrangler-action/gi,
];

function walk(dir, root, out) {
	for (const name of readdirSync(dir)) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		const stat = statSync(full);
		if (stat.isDirectory()) walk(full, root, out);
		else if (!SKIP_FILES.has(name) && TEXT.test(name)) out.push(relative(root, full).split(sep).join("/"));
	}
	return out;
}

export function scan(root, config) {
	const customer = config.customer ?? [];
	const skip = config.skip ?? [];
	const hits = [];
	for (const file of walk(root, root, [])) {
		if (skip.some((prefix) => file.startsWith(prefix))) continue;
		const isCustomer = customer.some((prefix) => file === prefix || file.startsWith(prefix));
		let allowed = false;
		readFileSync(join(root, file), "utf8")
			.split(/\r?\n/)
			.forEach((raw, index) => {
				if (raw.includes("neutral:allow-start")) allowed = true;
				if (raw.includes("neutral:allow-end")) {
					allowed = false;
					return;
				}
				if (allowed || raw.includes("neutral:allow-line")) return;
				let text = raw;
				for (const token of TOOLCHAIN) text = text.replace(token, "");
				if (EVERYWHERE.test(text)) hits.push({ file, line: index + 1, rule: "everywhere", text: raw.trim() });
				else if (isCustomer && CUSTOMER.test(text)) hits.push({ file, line: index + 1, rule: "customer", text: raw.trim() });
			});
	}
	return hits;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	const root = process.cwd();
	const configFile = join(root, "neutral.config.json");
	const config = existsSync(configFile) ? JSON.parse(readFileSync(configFile, "utf8")) : {};
	const hits = scan(root, config);
	for (const hit of hits) console.log(`${hit.file}:${hit.line} [${hit.rule}] ${hit.text.slice(0, 160)}`);
	if (hits.length) {
		console.error(`\n${hits.length} mention(s) of the infrastructure provider. See docs/superpowers/plans/2026-10-03-onforge-infraestructura-neutral.md.`);
		process.exit(1);
	}
	console.log("check-neutral: clean");
}
