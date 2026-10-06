import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";

/**
 * El cielo de OnForge: un solo shader WebGL2, sin dependencias.
 *
 * De noche: un degradado azul casi negro con estrellas que titilan, un mar de
 * nubes que se acerca despacio y, si se le da un ancla, el núcleo: una bola de
 * vidrio macizo con fuego dentro (lo que hay detrás se ve invertido, como en
 * una lente), una órbita fina inclinada y los despliegues como satélites. Un
 * despliegue sale del núcleo con una estela ámbar, entra en órbita y, cuando
 * está en vivo, se vuelve verde: el único verde del mundo es el de `live`. Los
 * anteriores siguen en órbita, atenuados, porque OnForge guarda cada uno.
 *
 * Quien monta el lienzo lo dirige con `control` (`deploy()` al lanzar,
 * `live()` al quedar en vivo): la portada lo sincroniza con su terminal. Sin
 * `control`, el núcleo despliega solo, cada poco.
 *
 * Coste acotado: el bucle sólo corre mientras el lienzo está en pantalla y la
 * pestaña visible; la resolución se limita a 1,5× y baja en pantallas
 * estrechas. Con movimiento reducido se pinta un solo fotograma. Si no hay
 * WebGL2 (o se pierde el contexto) avisa con `onUnsupported` y el CSS de debajo
 * (`.sk-hero-sky`, `.sk-orb`) se queda como está.
 *
 * El lienzo es decorativo (`aria-hidden`): lo que dice está dicho en el texto.
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uPlanet;
uniform float uTilt;
uniform float uHorizon;
uniform vec2 uFade;
uniform float uFlare;
uniform vec4 uSat[16];
uniform vec4 uSatCol[16];

out vec4 outColor;

const float SQUASH = 0.29;
const float ORBIT = 1.55;
const vec3 LIGHT = vec3(-0.5, -0.6, 0.62);

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
	float v = 0.0, a = 0.5;
	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
	for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
	return v;
}
vec2 rot(vec2 v, float a) { float s = sin(a), c = cos(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

// Una capa de estrellas: una por celda, pocas encendidas, cada una con su ritmo.
float starLayer(vec2 uv, float cells, float density, float size) {
	vec2 g = uv * cells;
	vec2 id = floor(g);
	vec2 f = fract(g) - 0.5;
	float h = hash(id);
	if (h < density) return 0.0;
	vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
	float d = length(f - o * 0.6);
	float tw = 0.55 + 0.45 * sin(uTime * (0.6 + h * 2.4) + h * 40.0);
	return smoothstep(size, 0.0, d) * tw * (h - density) / (1.0 - density);
}

vec3 sky(vec2 p) {
	vec2 uv = p / uRes;
	float asp = uRes.x / uRes.y;
	float h = uHorizon;
	vec3 top = vec3(0.018, 0.035, 0.082);
	vec3 mid = vec3(0.035, 0.07, 0.165);
	vec3 hor = vec3(0.085, 0.13, 0.25);
	vec3 col = mix(top, mid, smoothstep(0.0, h * 0.8, uv.y));
	col = mix(col, hor, smoothstep(h * 0.55, h, uv.y));
	// la luz fría de arriba a la izquierda
	vec2 b = (uv - vec2(0.1, 0.0)) * vec2(asp * 0.55, 1.15);
	col += vec3(0.04, 0.07, 0.17) * exp(-dot(b, b) * 2.2);
	// el resplandor del núcleo sobre el aire
	if (uPlanet.z > 0.0) {
		vec2 e = (p - uPlanet.xy) / (uPlanet.z * 3.0);
		col += vec3(0.30, 0.15, 0.045) * exp(-dot(e, e)) * (0.5 + 0.35 * uFlare);
	}
	// estrellas, que se apagan al bajar hacia el horizonte
	vec2 su = uv * vec2(asp, 1.0);
	float above = 1.0 - smoothstep(h - 0.18, h - 0.02, uv.y);
	float st = starLayer(su, 92.0, 0.955, 0.13) + 0.6 * starLayer(su + 17.0, 170.0, 0.93, 0.16);
	col += vec3(0.82, 0.88, 1.0) * st * above;

	float y = uv.y - h;
	if (y > -0.03) {
		float yy = max(y, 0.0) + 0.04;
		vec2 q = vec2((uv.x - 0.5) * asp / yy, 1.0 / yy) * 0.3;
		q.y += uTime * 0.03;
		vec2 w = vec2(fbm(q * 0.55 + vec2(7.3, 1.1)), fbm(q * 0.55 + vec2(2.9, 5.7)));
		float n = fbm(q + w * 0.9);
		float near = clamp(y * 3.0, 0.0, 1.0);
		float cover = smoothstep(0.40 - near * 0.24, 0.62 - near * 0.14, n);
		float lit = smoothstep(0.35, 0.85, n);
		vec3 cloud = mix(vec3(0.04, 0.065, 0.125), vec3(0.15, 0.2, 0.32), lit);
		// el fuego del núcleo enciende las crestas de debajo
		if (uPlanet.z > 0.0) {
			float dx = (p.x - uPlanet.x) / (uPlanet.z * 3.6);
			float glow = exp(-dx * dx) * exp(-max(y, 0.0) * 5.0);
			cloud += vec3(0.42, 0.21, 0.06) * glow * (0.35 + lit) * (0.65 + 0.35 * uFlare);
		}
		float fade = smoothstep(-0.03, 0.05, y);
		col = mix(col, cloud, cover * fade);
		col = mix(col, hor * 0.85, 0.55 * exp(-max(y, 0.0) * 24.0) * fade);
	}
	return col;
}

// La órbita: una línea fina; la mitad de atrás pasa detrás del núcleo.
vec4 orbitLine(vec2 d, float side) {
	vec2 e = rot(d, -uTilt);
	vec2 q = vec2(e.x, e.y / SQUASH);
	if (q.y * side < 0.0) return vec4(0.0);
	float rr = length(q);
	float w = length(vec2(q.x, q.y / SQUASH)) / max(rr, 1e-4) / uPlanet.z;
	float a = exp(-pow((rr - ORBIT) / (w * 1.1), 2.0));
	float th = atan(q.y, q.x);
	// un brillo que recorre la órbita, muy tenue
	float run = 0.5 + 0.5 * cos(th - uTime * 0.25);
	vec3 col = mix(vec3(0.55, 0.65, 0.85), vec3(0.85, 0.9, 1.0), run);
	float alpha = a * (side > 0.0 ? 0.42 : 0.2) * (0.75 + 0.25 * run);
	return vec4(col, alpha);
}

// Un satélite: cuerpo y halo, con luz propia.
void satellite(inout vec3 col, vec2 d, int i) {
	vec4 s = uSat[i];
	vec4 c = uSatCol[i];
	vec2 l = (d - s.xy) / s.z;
	float r = length(l);
	float px = 1.0 / (uPlanet.z * s.z);
	float body = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);
	float halo = exp(-r * r * 0.35);
	vec3 core = mix(c.rgb, vec3(1.0), 0.45 * (1.0 - r));
	col = mix(col, core, body * min(c.a, 1.0));
	col += c.rgb * halo * 0.5 * c.a * (1.0 - body);
}

vec3 backdrop(vec2 p) {
	vec3 col = sky(p);
	if (uPlanet.z > 0.0) {
		vec2 d = (p - uPlanet.xy) / uPlanet.z;
		vec4 o = orbitLine(d, -1.0);
		col = mix(col, o.rgb, o.a);
		for (int i = 0; i < 16; i++) {
			if (uSat[i].z > 0.0 && uSat[i].w < 0.0) satellite(col, d, i);
		}
	}
	return col;
}

void main() {
	vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
	vec3 col = backdrop(p);
	if (uPlanet.z > 0.0) {
		vec2 c = uPlanet.xy;
		float R = uPlanet.z;
		vec2 d = (p - c) / R;
		float r = length(d);
		if (r < 1.0 + 2.0 / R) {
			vec3 L = normalize(LIGHT);
			float z = sqrt(max(1.0 - r * r, 0.0));
			vec3 n = vec3(d, z);
			// Vidrio macizo: lo de detrás se ve invertido y recogido, con un poco de dispersión.
			vec2 inv = c - d * R * 0.58;
			vec3 refr = vec3(backdrop(mix(p, inv, 0.88)).r, backdrop(mix(p, inv, 0.84)).gb);
			vec3 inside = refr * vec3(0.8, 0.86, 1.0);
			// el fuego: un núcleo incandescente que se mueve despacio
			float rc = r / 0.6;
			float heat = exp(-rc * rc * 2.6);
			vec2 sw = rot(d, uTime * 0.12) * 2.6;
			float molten = fbm(sw + vec2(uTime * 0.16, -uTime * 0.09));
			heat *= 0.82 + 0.32 * molten;
			heat *= 1.0 + 0.35 * uFlare + 0.04 * sin(uTime * 2.1);
			vec3 ember = mix(vec3(0.78, 0.27, 0.05), vec3(1.0, 0.86, 0.62), smoothstep(0.3, 0.95, heat));
			inside += ember * heat;
			// un mapeo tonal suave: el fuego brilla sin quemarse a blanco
			inside = vec3(1.0) - exp(-inside * 1.25);
			// el canto del vidrio: frío arriba (la luz de la noche), cálido abajo (el fuego)
			float fres = pow(1.0 - z, 3.0);
			vec3 shell = mix(inside, vec3(0.7, 0.8, 1.0), fres * 0.55);
			shell += pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 140.0) * 0.55;
			vec2 dn = d / max(r, 1e-4);
			float lit = dot(dn, -normalize(L.xy));
			shell = mix(shell, vec3(0.8, 0.88, 1.0), smoothstep(0.86, 0.99, r) * smoothstep(0.15, 0.95, lit) * 0.45);
			shell = mix(shell, vec3(1.0, 0.6, 0.25), smoothstep(0.88, 1.0, r) * smoothstep(0.2, 0.95, -lit) * 0.35);
			float a = 1.0 - smoothstep(1.0 - 1.2 / R, 1.0 + 0.8 / R, r);
			col = mix(col, shell, a);
		}
		vec4 fo = orbitLine(d, 1.0);
		col = mix(col, fo.rgb, fo.a);
		for (int i = 0; i < 16; i++) {
			if (uSat[i].z > 0.0 && uSat[i].w > 0.0) satellite(col, d, i);
		}
	}
	vec2 uv = p / uRes;
	vec3 ground = vec3(0.027, 0.047, 0.094);
	col = mix(col, ground, uFade.x * (1.0 - smoothstep(0.0, 0.12, uv.y)));
	col = mix(col, ground, uFade.y * smoothstep(0.86, 1.0, uv.y));
	col += (hash(p + fract(uTime)) - 0.5) / 255.0;
	outColor = vec4(col, 1.0);
}`;

const SQUASH = 0.29;
const ORBIT = 1.55;
const TILT = -0.28;
/** Una vuelta completa de la órbita, en segundos. */
const ORBIT_SECONDS = 80;
/** Lo que tarda un despliegue en salir del núcleo y entrar en órbita. */
const LAUNCH_SECONDS = 2.4;
/** Los despliegues que se ven a la vez; el más viejo se apaga al llegar otro. */
const KEEP = 7;
/** El hueco entre un despliegue y el anterior en la órbita. */
const SPACING = (Math.PI * 2) / KEEP;
const TRAIL = 5;

const HISTORY: [number, number, number] = [0.64, 0.72, 0.88];
const LIVE: [number, number, number] = [0.27, 0.82, 0.5];
const LAUNCH: [number, number, number] = [1.0, 0.78, 0.48];

export interface DeployControl {
	/** Un despliegue sale del núcleo. */
	deploy: () => void;
	/** El último despliegue está en vivo: se vuelve verde y el anterior se apaga. */
	live: () => void;
}

interface Sat {
	/** Su sitio en la órbita, relativo al giro. */
	phi: number;
	/** Cuándo salió del núcleo (segundos del lienzo). */
	born: number;
	live: boolean;
	/** 0 → historial, 1 → en vivo; se acerca a su destino, no salta. */
	liveMix: number;
	/** Cuándo empezó a apagarse; -1 si sigue. */
	dying: number;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn("[sky] shader:", gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function SkyCanvas({
	planet,
	control,
	horizon,
	fade = [0, 0],
	quality = 1,
	onUnsupported,
	className = "",
}: {
	/** El elemento cuadrado que reserva el sitio del núcleo (órbita incluida). Sin él, sólo cielo. */
	planet?: RefObject<HTMLElement | null>;
	/** Quien dirige los despliegues; sin él, el núcleo despliega solo. */
	control?: MutableRefObject<DeployControl | null>;
	/** Altura del horizonte, 0 arriba y 1 abajo. */
	horizon: number;
	/** Cuánto se funde con el suelo de la página arriba y abajo (0..1). */
	fade?: [number, number];
	/** Multiplicador de resolución; el cielo es suave y aguanta menos píxeles. */
	quality?: number;
	onUnsupported?: () => void;
	className?: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ready, setReady] = useState(false);
	const unsupported = useRef(onUnsupported);
	useEffect(() => {
		unsupported.current = onUnsupported;
	}, [onUnsupported]);
	const [fadeTop, fadeBottom] = fade;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl2", {
			antialias: false,
			alpha: false,
			depth: false,
			stencil: false,
			premultipliedAlpha: false,
			powerPreference: "low-power",
		});
		if (!gl) {
			unsupported.current?.();
			return;
		}

		const vs = compile(gl, gl.VERTEX_SHADER, VERT);
		const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
		const program = gl.createProgram();
		if (!vs || !fs || !program) {
			unsupported.current?.();
			return;
		}
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn("[sky] link:", gl.getProgramInfoLog(program));
			unsupported.current?.();
			return;
		}
		gl.useProgram(program);

		// Un triángulo que cubre la pantalla entera.
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(program, "aPos");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const u = {
			res: gl.getUniformLocation(program, "uRes"),
			time: gl.getUniformLocation(program, "uTime"),
			planet: gl.getUniformLocation(program, "uPlanet"),
			tilt: gl.getUniformLocation(program, "uTilt"),
			horizon: gl.getUniformLocation(program, "uHorizon"),
			fade: gl.getUniformLocation(program, "uFade"),
			flare: gl.getUniformLocation(program, "uFlare"),
			sat: gl.getUniformLocation(program, "uSat"),
			satCol: gl.getUniformLocation(program, "uSatCol"),
		};
		gl.uniform1f(u.horizon, horizon);
		gl.uniform2f(u.fade, fadeTop, fadeBottom);

		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

		let scale = 1;
		let planetPx: [number, number, number] = [0, 0, 0];
		const satPos = new Float32Array(64);
		const satCol = new Float32Array(64);

		let time = 24; // arranca con las nubes ya formadas
		let lastDeploy = -100;

		// El historial de partida: cinco despliegues en órbita y el último en vivo.
		const sats: Sat[] = [];
		for (let i = 0; i < KEEP - 2; i++) {
			const live = i === KEEP - 3;
			sats.push({ phi: 0.6 - (KEEP - 3 - i) * -SPACING, born: -100, live, liveMix: live ? 1 : 0, dying: -1 });
		}

		const deploy = () => {
			const newest = sats[sats.length - 1];
			sats.push({ phi: (newest?.phi ?? 0) - SPACING, born: time, live: false, liveMix: 0, dying: -1 });
			lastDeploy = time;
			const alive = sats.filter((s) => s.dying < 0);
			if (alive.length > KEEP) alive[0].dying = time;
		};
		const live = () => {
			const newest = sats[sats.length - 1];
			if (!newest) return;
			for (const s of sats) s.live = false;
			newest.live = true;
		};
		if (control) control.current = { deploy, live };

		const measure = () => {
			const rect = canvas.getBoundingClientRect();
			const narrow = rect.width < 768;
			scale = Math.min(window.devicePixelRatio || 1, 1.5) * quality * (narrow ? 0.75 : 1);
			const w = Math.max(1, Math.round(rect.width * scale));
			const h = Math.max(1, Math.round(rect.height * scale));
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			gl.viewport(0, 0, w, h);
			gl.uniform2f(u.res, w, h);
			const anchor = planet?.current;
			if (anchor) {
				const a = anchor.getBoundingClientRect();
				// El ancla guarda la órbita entera: su mitad es 1,62 radios.
				planetPx = [(a.left + a.width / 2 - rect.left) * scale, (a.top + a.height / 2 - rect.top) * scale, (a.width / 2 / 1.62) * scale];
			} else {
				planetPx = [0, 0, 0];
			}
		};

		// Paralaje del puntero: un muelle amortiguado, nunca un valor directo.
		const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
		const onPointer = (e: PointerEvent) => {
			pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
			pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
		};
		if (finePointer && !reduce && planet) window.addEventListener("pointermove", onPointer, { passive: true });

		let last = 0;
		let raf = 0;
		let onScreen = true;
		let first = true;
		let autoNext = time + 2;

		const place = (slot: number, rad: number, th: number, tilt: number, size: number, rgb: [number, number, number], k: number, front?: boolean) => {
			const cs = Math.cos(tilt);
			const sn = Math.sin(tilt);
			const s = Math.sin(th);
			const ex = rad * Math.cos(th);
			const ey = rad * s * SQUASH;
			satPos[slot * 4] = cs * ex - sn * ey;
			satPos[slot * 4 + 1] = sn * ex + cs * ey;
			satPos[slot * 4 + 2] = size * (1 + 0.14 * s);
			satPos[slot * 4 + 3] = (front ?? s >= 0) ? 1 : -1;
			satCol[slot * 4] = rgb[0];
			satCol[slot * 4 + 1] = rgb[1];
			satCol[slot * 4 + 2] = rgb[2];
			satCol[slot * 4 + 3] = k;
		};

		const draw = (dt: number) => {
			// Sin director, el núcleo despliega solo: sale y, al llegar, está en vivo.
			if (!control?.current && !reduce && time >= autoNext) {
				deploy();
				autoNext = time + 9;
				setTimeout(() => live(), LAUNCH_SECONDS * 1000 + 600);
			}
			const ang = (time / ORBIT_SECONDS) * Math.PI * 2;
			const tilt = TILT + pointer.x * 0.03;
			satPos.fill(0);
			satCol.fill(0);
			let slot = 0;
			for (let i = sats.length - 1; i >= 0; i--) {
				const s = sats[i];
				if (s.dying >= 0 && time - s.dying > 1.2) sats.splice(i, 1);
			}
			for (const s of sats) {
				if (slot >= 16) break;
				s.liveMix += ((s.live ? 1 : 0) - s.liveMix) * Math.min(1, dt * 3);
				const fadeK = s.dying >= 0 ? Math.max(0, 1 - (time - s.dying) / 1.2) : 1;
				const rgb: [number, number, number] = [
					HISTORY[0] + (LIVE[0] - HISTORY[0]) * s.liveMix,
					HISTORY[1] + (LIVE[1] - HISTORY[1]) * s.liveMix,
					HISTORY[2] + (LIVE[2] - HISTORY[2]) * s.liveMix,
				];
				const age = time - s.born;
				const thOrbit = ang + s.phi;
				if (age < LAUNCH_SECONDS) {
					// Sale del núcleo en espiral, con su estela detrás.
					for (let j = TRAIL; j >= 0 && slot < 16; j--) {
						const t = Math.max(0, age / LAUNCH_SECONDS - j * 0.045);
						const e = easeOut(t);
						const rad = 0.5 + (ORBIT - 0.5) * e;
						const th = thOrbit - (1 - e) * 2.2;
						const k = j === 0 ? 1.3 : 0.55 * (1 - j / (TRAIL + 1));
						const size = j === 0 ? 0.06 : 0.05 * (1 - j / (TRAIL + 2));
						place(slot++, rad, th, tilt, size, LAUNCH, k * fadeK, rad < 1.1 ? true : undefined);
					}
				} else {
					const k = (0.72 + 0.5 * s.liveMix) * fadeK;
					place(slot++, ORBIT, thOrbit, tilt, s.live ? 0.068 : 0.052, rgb, k);
				}
			}
			const flare = time >= lastDeploy ? Math.exp(-(time - lastDeploy) * 1.4) : 0;
			const [cx, cy, r] = planetPx;
			gl.uniform3f(u.planet, cx + pointer.x * 10 * scale, cy + pointer.y * 6 * scale, r);
			gl.uniform1f(u.tilt, tilt);
			gl.uniform1f(u.flare, flare);
			gl.uniform4fv(u.sat, satPos);
			gl.uniform4fv(u.satCol, satCol);
			gl.uniform1f(u.time, time);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			if (first) {
				first = false;
				setReady(true);
			}
		};

		const frame = (now: number) => {
			const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
			last = now;
			time += dt;
			// muelle crítico: rigidez 40, amortiguación 2·√40
			const k = 40;
			const c = 2 * Math.sqrt(k);
			pointer.vx += (k * (pointer.tx - pointer.x) - c * pointer.vx) * dt;
			pointer.vy += (k * (pointer.ty - pointer.y) - c * pointer.vy) * dt;
			pointer.x += pointer.vx * dt;
			pointer.y += pointer.vy * dt;
			draw(dt);
			raf = requestAnimationFrame(frame);
		};

		const start = () => {
			if (reduce || raf || !onScreen || document.hidden) return;
			last = 0;
			raf = requestAnimationFrame(frame);
		};
		const stop = () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};

		const resize = new ResizeObserver(() => {
			measure();
			if (reduce || !raf) draw(0);
		});
		resize.observe(canvas);
		if (planet?.current) resize.observe(planet.current);

		const io = new IntersectionObserver(([entry]) => {
			onScreen = entry.isIntersecting;
			if (onScreen) start();
			else stop();
		});
		io.observe(canvas);

		const onVisibility = () => (document.hidden ? stop() : start());
		document.addEventListener("visibilitychange", onVisibility);

		const onLost = (e: Event) => {
			e.preventDefault();
			stop();
			setReady(false);
			unsupported.current?.();
		};
		canvas.addEventListener("webglcontextlost", onLost);

		measure();
		draw(0);
		start();

		return () => {
			stop();
			if (control) control.current = null;
			resize.disconnect();
			io.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("pointermove", onPointer);
			canvas.removeEventListener("webglcontextlost", onLost);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
		};
	}, [planet, control, horizon, fadeTop, fadeBottom, quality]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			data-ready={ready}
			className={`sk-canvas absolute inset-0 block size-full pointer-events-none ${className}`}
		/>
	);
}
