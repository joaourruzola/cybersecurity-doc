// CiberGuard — gerador de páginas estáticas (sem dependências).
// Uso: node build.mjs   (ou: npm run build)
// Lê model/topics.json e model/references.json e gera:
//   index.html, /<slug>/index.html, /referencias/index.html, 404.html,
//   sitemap.xml, robots.txt e _headers (Netlify).
// O CSS (css/style.css) é minificado e embutido em cada página: some o
// recurso que bloqueava a renderização no PageSpeed.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SITE = "https://ciberguard.netlify.app";
const AUTHOR = { name: "João Urruzola", url: "https://joaourruzola.netlify.app/" };
const OG_IMAGE = `${SITE}/resources/og-image.jpg`;
const TAGLINE = "Segurança da informação para o dia a dia, em português e sem complicação.";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const topics = read("./model/topics.json").topics;
const references = read("./model/references.json").topics;

const write = (path, content) => {
	const url = new URL("./" + path, import.meta.url);
	mkdirSync(new URL(".", url), { recursive: true });
	writeFileSync(url, content);
};

/* ---------------------------------------------------------------- utilidades */
const esc = (s) =>
	String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (html) =>
	html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s) =>
	stripTags(s)
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
const minutes = (html) => Math.max(1, Math.round(stripTags(html).split(" ").length / 200));

const minify = (file) =>
	readFileSync(new URL(file, import.meta.url), "utf8")
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\s+/g, " ")
		.replace(/\s*([{};])\s*/g, "$1")
		.replace(/;}/g, "}")
		.trim();
const css = minify("./css/style.css");
const homeCss = minify("./css/home.css");

const VIDEO_TITLES = {
	s9gXjaatFNM: "Código Fonte TV: autenticação de dois fatores (2FA)",
	"21Q-W28thnk": "Diolinux: tipos e níveis de backup",
};

/* Ajustes no HTML dos textos: ids nos títulos, links externos, vídeo sob demanda */
function enhance(html) {
	const headings = [];
	let out = html
		.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
			const id = slugify(inner);
			if (tag === "h2") headings.push({ id, text: stripTags(inner) });
			return `<${tag} id="${id}">${inner}</${tag}>`;
		})
		.replace(/<a ([^>]*href="https?:[^>]*)>/g, (m, attrs) =>
			/target=/.test(attrs) ? m : `<a ${attrs} target="_blank" rel="noopener noreferrer">`
		)
		.replace(/(src=["'])\.\/resources\//g, "$1/resources/")
		.replace(/<img /g, '<img decoding="async" ')
		.replace(/^<p>([\s\S]*?)<\/p>/, (m, inner) => (stripTags(inner).length <= 330 ? `<p class="lead">${inner}</p>` : m))
		.replace(
			/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)(?:\?([^"]*))?"[^>]*>\s*<\/iframe>/g,
			(_, id, query = "") => {
				const start = (query.match(/start=(\d+)/) || [])[1];
				const title = VIDEO_TITLES[id] || "Vídeo do YouTube";
				return `<div class="video" data-yt="${id}"${start ? ` data-start="${start}"` : ""} data-title="${esc(title)}"><a href="https://www.youtube.com/watch?v=${id}${start ? `&amp;t=${start}s` : ""}" target="_blank" rel="noopener noreferrer"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="Assistir ao vídeo: ${esc(title)}" width="480" height="360" loading="lazy" decoding="async"><span class="play" aria-hidden="true"></span><span class="video-label">Assistir: ${esc(title)}</span></a></div>`;
			}
		);
	return { html: out, headings };
}

/* ------------------------------------------------------------------ ícones */
const ICON_MENU = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ICON_HOME = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h4.5v-5.5h4v5.5h4.5V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_INFO = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ICON_THEME = `<svg class="sun" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg class="moon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const themeBtn = `<button class="icon-btn theme-toggle" type="button" aria-label="Alternar tema claro/escuro" aria-pressed="false">${ICON_THEME}</button>`;

/* Ilustrações originais (home) */
const SHIELD = `<svg viewBox="0 0 360 420" aria-hidden="true"><defs>
<radialGradient id="sg" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#22d3ee" stop-opacity=".55"/><stop offset=".6" stop-color="#7c3aed" stop-opacity=".18"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>
<linearGradient id="sf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".38"/><stop offset="1" stop-color="#6366f1" stop-opacity=".5"/></linearGradient>
<linearGradient id="ss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
<circle class="shield-glow" cx="180" cy="200" r="230" fill="url(#sg)"/>
<g stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.5" fill="none"><path d="M30 120H-30M30 200h-60M60 290l-50 40M330 120h60M330 200h60M300 290l50 40"/></g>
<g fill="#22d3ee"><circle cx="-30" cy="120" r="4"/><circle cx="-30" cy="200" r="4"/><circle cx="10" cy="330" r="4"/><circle cx="390" cy="120" r="4"/><circle cx="390" cy="200" r="4"/><circle cx="350" cy="330" r="4"/></g>
<path d="M180 14 328 66V198c0 92-60 163-148 206C92 361 32 290 32 198V66Z" fill="url(#sf)" stroke="url(#ss)" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M180 52 296 92V198c0 72-46 129-116 165C110 327 64 270 64 198V92Z" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
<circle cx="180" cy="176" r="31" fill="#07102a" stroke="url(#ss)" stroke-width="5"/>
<path d="M164 200h32l10 62h-52Z" fill="#07102a" stroke="url(#ss)" stroke-width="5" stroke-linejoin="round"/>
<circle cx="180" cy="176" r="9" fill="#22d3ee"/><path d="M180 184v34" stroke="#22d3ee" stroke-width="6" stroke-linecap="round"/></svg>`;


/* ------------------------------------------------------------------- peças */
const groups = [];
for (const t of topics) {
	let g = groups.find((x) => x.name === t.group);
	if (!g) groups.push((g = { name: t.group, items: [] }));
	g.items.push(t);
}

const brand = (cls = "") => `<a class="brand ${cls}" href="/" aria-label="CiberGuard — página inicial"><img src="/resources/logo.png" alt="" width="249" height="321">CiberGuard</a>`;

function sidebar(current) {
	const nav = groups
		.map(
			(g) => `<div class="nav-group"><p class="nav-title">${esc(g.name)}</p><ul>${g.items
				.map((t) => `<li><a href="/${t.slug}/"${t.slug === current ? ' aria-current="page"' : ""}>${esc(t.topic_name)}</a></li>`)
				.join("")}</ul></div>`
		)
		.join("");
	return `<aside class="sidebar" id="sidebar">
${brand("side-brand")}
<nav class="nav" aria-label="Tópicos">${nav}</nav>
<div class="side-foot"><a href="/referencias/"${current === "referencias" ? ' aria-current="page"' : ""}>Referências</a><a href="${AUTHOR.url}" target="_blank" rel="noopener">Autor ↗</a>${themeBtn}</div>
</aside>`;
}

const footer = `<footer class="site-foot">CiberGuard é um projeto acadêmico de extensão, feito por <a href="${AUTHOR.url}" target="_blank" rel="noopener">${AUTHOR.name}</a>. O conteúdo é informativo e não substitui orientação profissional.</footer>`;

function head({ title, description, path, noindex = false, type = "website", jsonld, extraCss = "", forceDark = false }) {
	const url = SITE + path;
	return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#070b14">
<meta name="author" content="${AUTHOR.name}">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="CiberGuard">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="CiberGuard — segurança da informação para o dia a dia">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/resources/logo.png">
<link rel="preload" href="/fonts/Inter-Regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/fonts/Inter-SemiBold.woff" as="font" type="font/woff" crossorigin>
<script>${forceDark ? "" : 'try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}'}document.documentElement.classList.add("js")</script>
<style>${css}${extraCss}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>`;
}

/* Página de documentação: papel + menu lateral, sem barra de topo no desktop */
function docPage({ title, description, path, current, crumb, header, toc = "", body, noindex, type, jsonld }) {
	return `${head({ title, description, path, noindex, type, jsonld })}
<body>
<a class="skip-link" href="#main">Pular para o conteúdo</a>
<div class="progress" aria-hidden="true"></div>
<header class="mbar">
<button id="menu-toggle" class="icon-btn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">${ICON_MENU}</button>
${brand()}
${themeBtn}
</header>
<div class="backdrop" id="backdrop" hidden></div>
<div class="shell"><div class="paper">
${sidebar(current)}
<div class="doc-grid">
<header class="doc-head">
<nav class="crumbs" aria-label="Você está em"><a href="/" aria-label="Início">${ICON_HOME}</a><span class="sep">›</span>${crumb}</nav>
${header}
</header>
${toc ? `<div class="doc-toc">${toc}</div>` : ""}
<main class="doc-body" id="main" tabindex="-1">
${body}
${footer}
</main>
</div>
</div></div>
<script src="/js/app.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ páginas */
// Início
const HOME_DESC =
	"Guia gratuito em português sobre segurança da informação: phishing, e-mail, ransomware, malware, DDoS, gerenciadores de senha, 2FA e backups.";
const searchIndex = JSON.stringify(
	topics.map((t) => ({ t: t.topic_name, h: t.h1, u: `/${t.slug}/`, d: t.description, g: t.group }))
);

const homeHtml = `${head({
	title: "CiberGuard | Segurança da informação para o dia a dia",
	description: HOME_DESC,
	path: "/",
	extraCss: homeCss,
	forceDark: true,
	jsonld: {
		"@context": "https://schema.org",
		"@graph": [
			{ "@type": "WebSite", "@id": SITE + "/#site", url: SITE + "/", name: "CiberGuard", inLanguage: "pt-BR", description: HOME_DESC, author: { "@type": "Person", ...AUTHOR } },
		],
	},
})}
<body class="home">
<a class="skip-link" href="#main">Pular para o conteúdo</a>
<header class="hnav">${brand()}<nav aria-label="Principal"><a href="/referencias/">Referências</a><a class="keep" href="/seguranca/">Começar</a></nav></header>
<main id="main">
<section class="hero">
<img class="hero-art" src="/resources/hero.svg" alt="" width="1600" height="900" fetchpriority="low" decoding="async">
<canvas class="hero-canvas" aria-hidden="true"></canvas>
<div class="hero-shield" aria-hidden="true">${SHIELD}</div>
<div class="hero-inner">
<h1>Segurança da informação, <em>explicada</em> para todo mundo.</h1>
<p class="hero-sub">Guia gratuito e em português sobre os ataques mais comuns e as medidas simples que protegem suas contas, seus dados e seu trabalho.</p>
<form class="search" role="search" onsubmit="return false">${ICON_SEARCH}<input id="q" type="search" placeholder="Pesquisar tópicos (ex.: phishing, senha, backup)" aria-label="Pesquisar tópicos" autocomplete="off" aria-controls="results"><div class="results" id="results" hidden></div></form>
<div class="hero-cta"><a class="cta primary" href="/seguranca/">Começar a ler<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="cta ghost" href="/phishing/">Ver ataques comuns</a></div>
<p class="hero-note">${topics.length} tópicos · leitura rápida · sem cadastro</p>
</div>
<p class="hero-foot">Projeto acadêmico de extensão · <a href="${AUTHOR.url}" target="_blank" rel="noopener">${AUTHOR.name}</a></p>
</section>

</main>
<script type="application/json" id="search-index">${searchIndex.replace(/</g, "\\u003c")}</script>
<script src="/js/app.js" defer></script>
<script src="/js/home.js" defer></script>
</body>
</html>
`;
write("index.html", homeHtml);

// Tópicos
const calloutHTML = (summary) =>
	`<aside class="callout"><p class="callout-title">${ICON_INFO} Resumo rápido</p><p>${esc(summary)}</p></aside>`;

topics.forEach((t, i) => {
	const { html, headings } = enhance(t.text);
	const withCallout = html.replace(/<\/p>/, `</p>${calloutHTML(t.summary)}`);
	const prev = topics[i - 1];
	const next = topics[i + 1];
	const toc =
		headings.length >= 2
			? `<nav class="toc" aria-label="Neste tópico"><p>Neste tópico</p>${headings.map((h) => `<a href="#${h.id}">${esc(h.text)}</a>`).join("")}</nav>`
			: "";
	const pager = `<nav class="pager" aria-label="Navegação entre tópicos">${
		prev ? `<a class="prev" rel="prev" href="/${prev.slug}/"><span class="dir">Anterior</span><span class="ttl">« ${esc(prev.topic_name)}</span></a>` : ""
	}${
		next ? `<a class="next" rel="next" href="/${next.slug}/"><span class="dir">Próximo</span><span class="ttl">${esc(next.topic_name)} »</span></a>` : ""
	}</nav>`;
	const path = `/${t.slug}/`;
	write(
		`${t.slug}/index.html`,
		docPage({
			title: `${t.seo_title} | CiberGuard`,
			description: t.description,
			path,
			current: t.slug,
			type: "article",
			crumb: `<span>${esc(t.group)}</span><span class="sep">›</span><span class="here">${esc(t.topic_name)}</span>`,
			header: `<h1>${esc(t.h1)}</h1><p class="meta"><span>${minutes(t.text)} min de leitura</span><span>${esc(t.group)}</span></p>`,
			toc,
			body: `<div class="prose">
${withCallout}
</div>
${pager}`,
			jsonld: {
				"@context": "https://schema.org",
				"@graph": [
					{ "@type": "Article", headline: t.h1, description: t.description, inLanguage: "pt-BR", mainEntityOfPage: SITE + path, image: OG_IMAGE, author: { "@type": "Person", ...AUTHOR }, publisher: { "@type": "Organization", name: "CiberGuard", logo: { "@type": "ImageObject", url: SITE + "/resources/logo.png" } } },
					{ "@type": "BreadcrumbList", itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Início", item: SITE + "/" },
						{ "@type": "ListItem", position: 2, name: t.group },
						{ "@type": "ListItem", position: 3, name: t.topic_name, item: SITE + path },
					] },
				],
			},
		})
	);
});

// Referências
const refItems = references
	.map((r) =>
		`<li>${r.text
			.replace(/(<br\s*\/?>\s*)+$/i, "")
			.replace(/<a ([^>]*href='https?:[^>]*)>/g, (_, a) => `<a ${a} target="_blank" rel="noopener noreferrer">`)}</li>`
	)
	.join("");
write(
	"referencias/index.html",
	docPage({
		title: "Referências e fontes | CiberGuard",
		description: "Fontes consultadas para o conteúdo do CiberGuard: LGPD, relatórios sobre crimes cibernéticos, artigos sobre DDoS, malware e cibersegurança.",
		path: "/referencias/",
		current: "referencias",
		crumb: `<span class="here">Referências</span>`,
		header: `<h1>Referências</h1><p class="meta"><span>${references.length} fontes</span></p>`,
		body: `<div class="prose"><p class="lead">Materiais consultados na elaboração dos textos deste site.</p></div><ol class="refs" style="margin-top:1.75rem">${refItems}</ol>`,
	})
);

// 404
write(
	"404.html",
	docPage({
		title: "Página não encontrada | CiberGuard",
		description: "A página que você procurou não existe.",
		path: "/404.html",
		current: "",
		noindex: true,
		crumb: `<span class="here">Erro 404</span>`,
		header: `<h1>Página não encontrada</h1>`,
		body: `<div class="prose"><p class="lead">O endereço que você abriu não existe ou mudou de lugar. Escolha um tópico no menu ou volte ao início.</p><a class="btn" href="/">Voltar ao início</a></div>`,
	})
);

// sitemap, robots e headers do Netlify
const urls = ["/", ...topics.map((t) => `/${t.slug}/`), "/referencias/"];
write(
	"sitemap.xml",
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
		.map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
		.join("\n")}\n</urlset>\n`
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write(
	"_headers",
	`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/resources/*
  Cache-Control: public, max-age=604800

/js/*
  Cache-Control: public, max-age=86400
`
);

console.log(`OK: ${topics.length} tópicos + início + referências + 404 (CSS: ${(css.length / 1024).toFixed(1)} KB docs, +${(homeCss.length / 1024).toFixed(1)} KB home)`);
