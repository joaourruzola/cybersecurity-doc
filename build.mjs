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

const css = readFileSync(new URL("./css/style.css", import.meta.url), "utf8")
	.replace(/\/\*[\s\S]*?\*\//g, "")
	.replace(/\s+/g, " ")
	.replace(/\s*([{};])\s*/g, "$1")
	.replace(/;}/g, "}")
	.trim();

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
const ICON_THEME = `<svg class="sun" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg class="moon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const themeBtn = `<button class="icon-btn theme-toggle" type="button" aria-label="Alternar tema claro/escuro" aria-pressed="false">${ICON_THEME}</button>`;

/* ------------------------------------------------------------------- peças */
const groups = [];
for (const t of topics) {
	let g = groups.find((x) => x.name === t.group);
	if (!g) groups.push((g = { name: t.group, items: [] }));
	g.items.push(t);
}

const brand = `<a class="brand" href="/" aria-label="CiberGuard — página inicial"><img src="/resources/logo.png" alt="" width="249" height="321">CiberGuard</a>`;

function sidebar(current) {
	const nav = groups
		.map(
			(g) => `<div class="nav-group"><p class="nav-title">${esc(g.name)}</p><ul>${g.items
				.map(
					(t) =>
						`<li><a href="/${t.slug}/"${t.slug === current ? ' aria-current="page"' : ""}>${esc(t.topic_name)}</a></li>`
				)
				.join("")}</ul></div>`
		)
		.join("");
	return `<aside class="sidebar" id="sidebar">
<div class="intro">${brand}<p class="tagline">${esc(TAGLINE)}</p></div>
<nav class="nav" aria-label="Tópicos">${nav}</nav>
<div class="side-foot"><a href="/referencias/"${current === "referencias" ? ' aria-current="page"' : ""}>Referências</a><a href="${AUTHOR.url}" target="_blank" rel="noopener">Autor ↗</a>${themeBtn}</div>
</aside>`;
}

function shell({ title, description, path, main, current, jsonld, noindex = false, type = "website" }) {
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
<meta name="theme-color" content="#111827">
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
<link rel="preload" href="/fonts/Inter-Medium.woff" as="font" type="font/woff" crossorigin>
<script>try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}document.documentElement.classList.add("js")</script>
<style>${css}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<a class="skip-link" href="#main">Pular para o conteúdo</a>
<div class="progress" aria-hidden="true"></div>
<header class="topbar">
<button id="menu-toggle" class="icon-btn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">${ICON_MENU}</button>
${brand}
${themeBtn}
</header>
<div class="backdrop" id="backdrop" hidden></div>
<div class="layout">
${sidebar(current)}
<main class="content" id="main" tabindex="-1">
${main}
<footer class="site-foot">CiberGuard é um projeto acadêmico de extensão, feito por <a href="${AUTHOR.url}" target="_blank" rel="noopener">${AUTHOR.name}</a>. O conteúdo é informativo e não substitui orientação profissional.</footer>
</main>
</div>
<script src="/js/app.js" defer></script>
</body>
</html>
`;
}

const card = (t, i) => `<a class="card reveal" href="/${t.slug}/"><span class="card-num">${String(i + 1).padStart(2, "0")}</span><div><span class="card-title">${esc(t.h1)}</span><p class="card-desc">${esc(t.description)}</p><span class="card-more">Ler tópico →</span></div></a>`;

/* ------------------------------------------------------------------ páginas */
// Início
const HOME_DESC =
	"Guia gratuito em português sobre segurança da informação: phishing, e-mail, ransomware, malware, DDoS, gerenciadores de senha, 2FA e backups.";
const homeMain = `<article class="doc">
<header><p class="section-title">Guia de cibersegurança</p>
<h1>Segurança da informação, explicada para todo mundo.</h1></header>
<div class="prose">
<p class="lead">Bem-vindo ao CiberGuard, um espaço dedicado à segurança na web e à proteção de dados. Aqui explicamos os desafios e as soluções para manter sua presença online segura e seus dados protegidos.</p>
<p>Em um mundo digital onde as ameaças são cada vez mais sofisticadas, entender e se defender de ataques comuns como phishing, e-mails maliciosos, ransomware, malware e DDoS é fundamental.</p>
<p>Falamos dos perigos e também das medidas que você pode adotar: gerenciadores de senhas, autenticação de dois fatores (2FA) e backups robustos, tanto para o uso pessoal quanto para o empresarial. Vamos construir juntos uma presença digital mais segura e resiliente.</p>
</div>
${groups
	.map((g) => {
		const start = topics.indexOf(g.items[0]);
		return `<section class="home-group"><h2 class="section-title">${esc(g.name)}</h2><div class="card-list">${g.items
			.map((t, i) => card(t, start + i))
			.join("")}</div></section>`;
	})
	.join("\n")}
</article>`;
write(
	"index.html",
	shell({
		title: "CiberGuard | Segurança da informação para o dia a dia",
		description: HOME_DESC,
		path: "/",
		main: homeMain,
		current: "",
		jsonld: {
			"@context": "https://schema.org",
			"@graph": [
				{ "@type": "WebSite", "@id": SITE + "/#site", url: SITE + "/", name: "CiberGuard", inLanguage: "pt-BR", description: HOME_DESC, author: { "@type": "Person", ...AUTHOR } },
			],
		},
	})
);

// Tópicos
topics.forEach((t, i) => {
	const { html, headings } = enhance(t.text);
	const prev = topics[i - 1];
	const next = topics[i + 1];
	const toc =
		headings.length >= 2
			? `<nav class="toc" aria-label="Neste tópico"><p>Neste tópico</p>${headings.map((h) => `<a href="#${h.id}">${esc(h.text)}</a>`).join("")}</nav>`
			: "";
	const pager = `<nav class="pager" aria-label="Navegação entre tópicos">${
		prev ? `<a class="card reveal prev" rel="prev" href="/${prev.slug}/"><div><span class="dir">← Anterior</span><br><span class="card-title">${esc(prev.topic_name)}</span><p class="card-desc">${esc(prev.description)}</p></div></a>` : ""
	}${
		next ? `<a class="card reveal next" rel="next" href="/${next.slug}/"><div><span class="dir">Próximo →</span><br><span class="card-title">${esc(next.topic_name)}</span><p class="card-desc">${esc(next.description)}</p></div></a>` : ""
	}</nav>`;
	const path = `/${t.slug}/`;
	write(
		`${t.slug}/index.html`,
		shell({
			title: `${t.seo_title} | CiberGuard`,
			description: t.description,
			path,
			current: t.slug,
			type: "article",
			main: `<article class="doc">
<header><p class="section-title">${esc(t.group)}</p>
<h1>${esc(t.h1)}</h1>
<p class="meta">${minutes(t.text)} min de leitura</p></header>
${toc}
<div class="prose">
${html}
</div>
${pager}
</article>`,
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
	shell({
		title: "Referências e fontes | CiberGuard",
		description: "Fontes consultadas para o conteúdo do CiberGuard: LGPD, relatórios sobre crimes cibernéticos, artigos sobre DDoS, malware e cibersegurança.",
		path: "/referencias/",
		current: "referencias",
		main: `<article class="doc"><header><p class="section-title">Fontes</p><h1>Referências</h1></header><div class="prose"><p>Materiais consultados na elaboração dos textos deste site.</p></div><ol class="refs" style="margin-top:2rem;max-width:44rem">${refItems}</ol></article>`,
	})
);

// 404
write(
	"404.html",
	shell({
		title: "Página não encontrada | CiberGuard",
		description: "A página que você procurou não existe.",
		path: "/404.html",
		current: "",
		noindex: true,
		main: `<article class="doc"><header><p class="section-title">Erro 404</p><h1>Página não encontrada</h1></header><div class="prose"><p>O endereço que você abriu não existe ou mudou de lugar. Escolha um tópico no menu ou volte ao início.</p><a class="btn" href="/">Voltar ao início</a></div></article>`,
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

console.log(`OK: ${topics.length} tópicos + início + referências + 404 (${(css.length / 1024).toFixed(1)} KB de CSS embutido)`);
