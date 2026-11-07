/* CiberGuard — comportamento leve (sem dependências). Páginas já vêm prontas do build. */
(() => {
	"use strict";
	const d = document;
	const root = d.documentElement;
	const body = d.body;

	/* Links antigos (#/phishing) → páginas reais (/phishing/) */
	const legacy = () => {
		const m = location.hash.match(/^#\/([\w-]+)$/);
		if (m && (location.pathname === "/" || location.pathname.endsWith("/index.html"))) {
			location.replace("/" + m[1] + "/");
			return true;
		}
		return false;
	};
	addEventListener("hashchange", legacy);
	if (legacy()) return;

	const store = {
		set(k, v) {
			try { localStorage.setItem(k, v); } catch (e) {}
		},
	};

	/* Tema */
	const toggles = d.querySelectorAll(".theme-toggle");
	const meta = d.querySelector('meta[name="theme-color"]');
	const sync = () => {
		const light = root.dataset.theme === "light";
		toggles.forEach((b) => {
			b.setAttribute("aria-pressed", String(light));
			b.setAttribute("title", light ? "Tema escuro" : "Tema claro");
		});
		if (meta) meta.content = light ? "#f8fafc" : "#111827";
	};
	toggles.forEach((b) =>
		b.addEventListener("click", () => {
			const light = root.dataset.theme !== "light";
			root.dataset.theme = light ? "light" : "dark";
			store.set("theme", root.dataset.theme);
			sync();
		})
	);
	sync();

	/* Gaveta (mobile) */
	const menuBtn = d.getElementById("menu-toggle");
	const backdrop = d.getElementById("backdrop");
	const setMenu = (open) => {
		body.classList.toggle("menu-open", open);
		if (menuBtn) {
			menuBtn.setAttribute("aria-expanded", String(open));
			menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
		}
		if (backdrop) backdrop.hidden = !open;
	};
	if (menuBtn) {
		menuBtn.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
		backdrop && backdrop.addEventListener("click", () => setMenu(false));
		d.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && body.classList.contains("menu-open")) {
				setMenu(false);
				menuBtn.focus();
			}
		});
		matchMedia("(min-width:900px)").addEventListener("change", (e) => e.matches && setMenu(false));
		d.getElementById("sidebar").addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
	}

	/* Barra de progresso de leitura */
	const bar = d.querySelector(".progress");
	if (bar) {
		let ticking = false;
		const update = () => {
			const max = root.scrollHeight - innerHeight;
			bar.style.setProperty("--p", max > 0 ? Math.min(scrollY / max, 1).toFixed(4) : 0);
			ticking = false;
		};
		addEventListener("scroll", () => !ticking && ((ticking = true), requestAnimationFrame(update)), { passive: true });
		update();
	}

	/* Revelação ao rolar */
	const targets = d.querySelectorAll(".reveal, .section-title");
	if ("IntersectionObserver" in window) {
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((en) => {
					if (en.isIntersecting) {
						en.target.classList.add("is-visible");
						io.unobserve(en.target);
					}
				}),
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
		);
		targets.forEach((t) => io.observe(t));
	} else targets.forEach((t) => t.classList.add("is-visible"));

	/* Índice "Neste tópico": destaca a seção visível */
const tocLinks = [...d.querySelectorAll(".toc a")];
if (tocLinks.length && "IntersectionObserver" in window) {
		const map = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
		const spy = new IntersectionObserver(
			(entries) =>
				entries.forEach((en) => {
					if (en.isIntersecting) {
						tocLinks.forEach((a) => a.classList.remove("on"));
						const link = map.get(en.target.id);
						link && link.classList.add("on");
					}
				}),
			{ rootMargin: "0px 0px -70% 0px" }
		);
		map.forEach((_, id) => {
			const h = d.getElementById(id);
			h && spy.observe(h);
		});
	}

	/* Vídeo sob demanda: o player do YouTube só carrega após o clique */
	d.addEventListener("click", (e) => {
		const box = e.target.closest(".video[data-yt]");
		if (!box || e.metaKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		const f = d.createElement("iframe");
		const start = box.dataset.start ? "&start=" + box.dataset.start : "";
		f.src = "https://www.youtube-nocookie.com/embed/" + box.dataset.yt + "?autoplay=1&rel=0" + start;
		f.title = box.dataset.title || "Vídeo do YouTube";
		f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
		f.allowFullscreen = true;
		box.replaceChildren(f);
	});
})();
