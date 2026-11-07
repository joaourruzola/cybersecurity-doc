"use strict";

/* ==========================================================================
   CiberGuard — comportamento da página
   Rotas por hash:  #/ (início) · #/referencias · #/<slug-do-topico>
   ========================================================================== */

const els = {
	menuToggle: document.getElementById("menu-toggle"),
	sidebar: document.getElementById("sidebar"),
	backdrop: document.getElementById("backdrop"),
	themeToggle: document.getElementById("theme-toggle"),
	title: document.getElementById("topic-title"),
	text: document.getElementById("topic-text"),
	cards: document.getElementById("cards"),
	main: document.getElementById("main"),
};

const HOME = { title: els.title.textContent, html: els.text.innerHTML };
const LAST_KEY = "clicked_item"; // mesma chave de antes (agora guarda o slug)
const desktopQuery = window.matchMedia("(min-width: 901px)");

let topics = [];
let references = [];

/* ---------- localStorage seguro (pode lançar erro em modo privado) ---------- */
const store = {
	get(key) {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch {}
	},
};

/* ---------- Dados ---------- */
async function loadJSON(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return response.json();
}

async function loadData() {
	const [t, r] = await Promise.all([
		loadJSON("./model/topics.json"),
		loadJSON("./model/references.json"),
	]);
	topics = t.topics;
	references = r.topics;
}

/* ---------- Utilidades ---------- */
function plainText(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

function escapeHTML(str) {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}

const ICON_BACK =
	'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT =
	'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- Menu lateral (montado a partir do JSON) ---------- */
function buildSidebar() {
	const groups = [];
	for (const topic of topics) {
		let group = groups.find((g) => g.name === topic.group);
		if (!group) groups.push((group = { name: topic.group, items: [] }));
		group.items.push(topic);
	}

	const sections = groups
		.map(
			(g) => `
		<p class="sideTitle">${escapeHTML(g.name)}</p>
		<ul>
			${g.items
				.map(
					(t) =>
						`<li class="sideBar-item"><a href="#/${t.slug}" data-route="${t.slug}">${escapeHTML(t.topic_name)}</a></li>`
				)
				.join("")}
		</ul>`
		)
		.join("");

	// Itens que no desktop ficam no topo da página e no mobile ficam na gaveta.
	const extra = `
		<p class="sideTitle only-mobile">Mais</p>
		<ul class="only-mobile">
			<li class="sideBar-item"><a href="#/referencias" data-route="referencias">Referências</a></li>
			<li class="sideBar-item"><a href="https://joaourruzola.netlify.app/" target="_blank" rel="noopener">Autor</a></li>
		</ul>`;

	els.sidebar.innerHTML = sections + extra;
}

function highlightMenu(route) {
	document.querySelectorAll("[data-route]").forEach((a) => {
		const active = a.dataset.route === route;
		a.classList.toggle("selected", active);
		if (active) a.setAttribute("aria-current", "page");
		else a.removeAttribute("aria-current");
	});
}

/* ---------- Gaveta (mobile) ---------- */
function setMenu(open) {
	document.body.classList.toggle("menu-open", open);
	els.menuToggle.setAttribute("aria-expanded", String(open));
	els.menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
	els.backdrop.hidden = !open;
}

els.menuToggle.addEventListener("click", () => {
	setMenu(!document.body.classList.contains("menu-open"));
});
els.backdrop.addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
		setMenu(false);
		els.menuToggle.focus();
	}
});
desktopQuery.addEventListener("change", (e) => {
	if (e.matches) setMenu(false);
});

/* ---------- Tema ---------- */
function syncThemeButton() {
	const dark = document.documentElement.classList.contains("dark-theme");
	els.themeToggle.setAttribute("aria-pressed", String(dark));
	els.themeToggle.setAttribute("title", dark ? "Tema claro" : "Tema escuro");
}

els.themeToggle.addEventListener("click", () => {
	const dark = document.documentElement.classList.toggle("dark-theme");
	store.set("dark_theme", String(dark));
	syncThemeButton();
});
syncThemeButton();

/* ---------- Cards anterior / próximo ---------- */
function cardHTML(kind, label, name, excerpt, href) {
	const head =
		kind === "back"
			? `<span class="cardLabel">${ICON_BACK} ${label}</span>`
			: `<span class="cardLabel">${label} ${ICON_NEXT}</span>`;
	return `<a class="${kind}Card" href="${href}">
		${head}
		<h4>${escapeHTML(name)}</h4>
		<p>${escapeHTML(excerpt)}</p>
	</a>`;
}

function renderCards(index) {
	// index: posição do tópico atual; -1 = início; null = sem cards
	if (index === null) {
		els.cards.innerHTML = "";
		return;
	}
	const prev = index > 0 ? topics[index - 1] : null;
	const next = index < topics.length - 1 ? topics[index + 1] : null;
	els.cards.innerHTML =
		(prev ? cardHTML("back", "Voltar", prev.topic_name, plainText(prev.text), `#/${prev.slug}`) : "") +
		(next
			? cardHTML(
					"next",
					index === -1 ? "Começar" : "Próximo",
					next.topic_name,
					plainText(next.text),
					`#/${next.slug}`
				)
			: "");
}

/* ---------- Renderização ---------- */
function decorateLinks() {
	els.text.querySelectorAll('a[href^="http"]').forEach((a) => {
		a.target = "_blank";
		a.rel = "noopener noreferrer";
	});
}

function show(title, html, { pageTitle = title } = {}) {
	els.title.textContent = title;
	els.text.innerHTML = html;
	document.title = pageTitle ? `${pageTitle} | CiberGuard` : "CiberGuard | Segurança da Informação";
	decorateLinks();
}

function renderHome() {
	show(HOME.title, HOME.html, { pageTitle: "" });
	renderCards(-1);
	highlightMenu("");
}

function renderReferences() {
	const items = references
		.map((r) => `<li>${r.text.replace(/(<br\s*\/?>\s*)+$/i, "")}</li>`)
		.join("");
	show("Referências", `<ul class="ref-list">${items}</ul>`);
	renderCards(null);
	highlightMenu("referencias");
}

function renderTopic(index) {
	const topic = topics[index];
	show(topic.topic_name, topic.text);
	renderCards(index);
	highlightMenu(topic.slug);
	store.set(LAST_KEY, topic.slug);
}

function renderNotFound() {
	show(
		"Tópico não encontrado",
		'Não encontramos esse endereço. <a href="#/">Voltar ao início</a>.'
	);
	renderCards(null);
	highlightMenu("");
}

function renderError() {
	show(
		"Não foi possível carregar o conteúdo",
		'Verifique sua conexão e tente de novo. Se estiver abrindo o arquivo direto do disco, use um servidor local (<code>npm run live</code>). <br><br><button type="button" class="retry">Tentar novamente</button>',
		{ pageTitle: "" }
	);
	renderCards(null);
	els.text.querySelector(".retry").addEventListener("click", () => start());
}

/* ---------- Roteador ---------- */
let firstRender = true;

function route() {
	const key = decodeURIComponent(location.hash.replace(/^#\/?/, ""));

	if (!key) renderHome();
	else if (key === "referencias") renderReferences();
	else {
		const index = topics.findIndex((t) => t.slug === key);
		if (index === -1) renderNotFound();
		else renderTopic(index);
	}

	setMenu(false);
	window.scrollTo(0, 0);
	if (!firstRender) {
		// leva o foco para o título (leitores de tela / teclado) sem rolar a página
		els.title.setAttribute("tabindex", "-1");
		els.title.focus({ preventScroll: true });
	}
	firstRender = false;
}

window.addEventListener("hashchange", () => {
	if (topics.length) route();
});

// Clicar em um link para a página em que já estamos (ex.: logo) não dispara
// "hashchange"; então re-renderizamos e voltamos ao topo manualmente.
document.addEventListener("click", (e) => {
	const link = e.target.closest('a[href^="#/"]');
	if (!link || !topics.length) return;
	if (link.getAttribute("href") === (location.hash || "#/")) {
		e.preventDefault();
		route();
	}
});

/* ---------- Início ---------- */
async function start() {
	try {
		await loadData();
	} catch (error) {
		console.error("Erro ao carregar dados:", error);
		renderError();
		return;
	}

	buildSidebar();

	// Sem hash na URL: retoma o último tópico lido (comportamento anterior).
	if (!location.hash) {
		const last = store.get(LAST_KEY);
		if (last && topics.some((t) => t.slug === last)) {
			history.replaceState(null, "", `#/${last}`);
		}
	}
	route();
}

start();
