/* CiberGuard — página inicial: busca de tópicos + animação do hero (canvas leve) */
(() => {
	"use strict";
	const d = document;
	const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

	/* ---------- Busca ---------- */
	const input = d.getElementById("q");
	const box = d.getElementById("results");
	const dataEl = d.getElementById("search-index");
	if (input && box && dataEl) {
		const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
		const items = JSON.parse(dataEl.textContent).map((i) => ({ ...i, k: norm(i.t + " " + i.h + " " + i.d + " " + i.g) }));
		const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
		const render = () => {
			const terms = norm(input.value).split(/\s+/).filter(Boolean);
			if (!terms.length) return (box.hidden = true);
			const hits = items.filter((i) => terms.every((t) => i.k.includes(t))).slice(0, 6);
			box.innerHTML = hits.length
				? hits.map((i) => `<a href="${i.u}"><b>${esc(i.t)}</b><small>${esc(i.h)}</small></a>`).join("")
				: "<p>Nenhum tópico encontrado. Tente “phishing”, “senha” ou “backup”.</p>";
			box.hidden = false;
		};
		input.addEventListener("input", render);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const first = box.querySelector("a");
				first && (location.href = first.href);
			} else if (e.key === "Escape") box.hidden = true;
			else if (e.key === "ArrowDown") {
				const first = box.querySelector("a");
				first && (e.preventDefault(), first.focus());
			}
		});
		box.addEventListener("keydown", (e) => {
			const a = e.target.closest("a");
			if (!a) return;
			if (e.key === "ArrowDown" && a.nextElementSibling) (e.preventDefault(), a.nextElementSibling.focus());
			if (e.key === "ArrowUp") (e.preventDefault(), (a.previousElementSibling || input).focus());
		});
		d.addEventListener("click", (e) => !e.target.closest(".search") && (box.hidden = true));
		// atalho: "/" foca a busca
		d.addEventListener("keydown", (e) => {
			if (e.key === "/" && !/INPUT|TEXTAREA/.test(d.activeElement.tagName)) (e.preventDefault(), input.focus());
		});
	}

	/* ---------- Hero: rede de partículas + paralaxe do escudo ---------- */
	const hero = d.querySelector(".hero");
	const cv = d.querySelector(".hero-canvas");
	if (!hero || !cv || !cv.getContext) return;
	const ctx = cv.getContext("2d");
	const shield = d.querySelector(".hero-shield");
	let w = 0, h = 0, pts = [], raf = 0, running = false;
	const mouse = { x: -9999, y: -9999 };

	const resize = () => {
		const dpr = Math.min(devicePixelRatio || 1, 1.5);
		const r = cv.getBoundingClientRect();
		w = r.width;
		h = r.height;
		cv.width = Math.round(w * dpr);
		cv.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const n = Math.round(Math.min(64, Math.max(24, (w * h) / 24000)));
		pts = Array.from({ length: n }, () => ({
			x: Math.random() * w,
			y: Math.random() * h * 0.82,
			vx: (Math.random() - 0.5) * 0.28,
			vy: (Math.random() - 0.5) * 0.28,
			r: Math.random() * 1.4 + 0.6,
		}));
		if (!running) draw();
	};

	const LINK = 135;
	function draw() {
		ctx.clearRect(0, 0, w, h);
		for (const p of pts) {
			if (running) {
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < -10) p.x = w + 10;
				else if (p.x > w + 10) p.x = -10;
				if (p.y < -10) p.y = h * 0.82;
				else if (p.y > h * 0.84) p.y = -10;
			}
			ctx.fillStyle = "rgba(125,235,255,.85)";
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, 6.2832);
			ctx.fill();
		}
		ctx.lineWidth = 1;
		for (let i = 0; i < pts.length; i++) {
			const a = pts[i];
			for (let j = i + 1; j < pts.length; j++) {
				const b = pts[j];
				const dx = a.x - b.x, dy = a.y - b.y;
				const dist = dx * dx + dy * dy;
				if (dist < LINK * LINK) {
					ctx.strokeStyle = `rgba(34,211,238,${(1 - Math.sqrt(dist) / LINK) * 0.35})`;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.stroke();
				}
			}
			const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
			if (md < 160 * 160) {
				ctx.strokeStyle = `rgba(167,139,250,${(1 - Math.sqrt(md) / 160) * 0.55})`;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(mouse.x, mouse.y);
				ctx.stroke();
			}
		}
		if (running) raf = requestAnimationFrame(draw);
	}

	const start = () => {
		if (running || reduce) return;
		running = true;
		raf = requestAnimationFrame(draw);
	};
	const stop = () => {
		running = false;
		cancelAnimationFrame(raf);
	};

	resize();
	let t;
	addEventListener("resize", () => (clearTimeout(t), (t = setTimeout(resize, 150))));
	if ("IntersectionObserver" in window) new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop())).observe(hero);
	else start();
	d.addEventListener("visibilitychange", () => (d.hidden ? stop() : start()));

	if (matchMedia("(hover:hover)").matches && !reduce) {
		hero.addEventListener("pointermove", (e) => {
			const r = hero.getBoundingClientRect();
			mouse.x = e.clientX - r.left;
			mouse.y = e.clientY - r.top;
			if (shield) {
				shield.style.setProperty("--px", ((mouse.x / r.width - 0.5) * -26).toFixed(1) + "px");
				shield.style.setProperty("--py", ((mouse.y / r.height - 0.5) * -18).toFixed(1) + "px");
			}
		}, { passive: true });
		hero.addEventListener("pointerleave", () => {
			mouse.x = mouse.y = -9999;
			shield && (shield.style.setProperty("--px", "0px"), shield.style.setProperty("--py", "0px"));
		});
	}
})();
