[![Netlify Status](https://api.netlify.com/api/v1/badges/0becdd4c-ff9c-4a1c-abf7-6a9f6ffc5a27/deploy-status)](https://app.netlify.com/sites/ciberguard/deploys)

# Cybersecurity Docs

A documentation-style website that explains cybersecurity concepts for everyday users. It follows a "Technology for everyone" approach, aimed at people of all ages who have limited access to technology or want to improve their online safety skills.

🔗 **Live site:** https://ciberguard.netlify.app/

## Features

- Documentation-style layout inspired by the author's portfolio: dark gradient + grain + slow "aurora", cyan accent, Inter, line-style navigation, cards with cursor glow
- Light/dark theme (dark by default, choice is remembered)
- Responsive, mobile-first (off-canvas menu on phones, fixed side panel on desktop)
- One real, static page per topic (`/phishing/`, `/ransomware/`, ...) so search engines can index each one
- SEO: unique title/description per page, canonical, Open Graph, JSON-LD (Article + BreadcrumbList), `sitemap.xml`, `robots.txt`
- Performance: no render-blocking requests (CSS is inlined, Inter is self-hosted and subsetted, no icon/font CDN), WebP images, YouTube player loaded only on click
- Animations use only `transform`/`opacity` and respect `prefers-reduced-motion`

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (~3 KB, deferred)
- A zero-dependency Node script (`build.mjs`) that generates the pages

## Getting Started

Content lives in `model/topics.json` and `model/references.json`. After editing it (or `css/style.css`), regenerate the pages and commit the result:

```bash
npm install
npm run build   # regenerates index.html, /<topic>/index.html, sitemap.xml, ...
npm run live    # build + local server with live reload
```

Netlify needs no build command: the generated files are committed and published from the repository root.

## Project Structure

```
├── build.mjs           # Static page generator (run with `npm run build`)
├── model/
│   ├── topics.json     # Topics: slug, SEO title/description, h1, HTML content
│   └── references.json # Sources and references
├── css/style.css       # Source stylesheet (inlined into every page by the build)
├── js/app.js           # Theme, mobile menu, progress bar, reveal, lite video
├── fonts/              # Inter (SIL OFL 1.1), latin subset
├── resources/          # Images (WebP) and OG image
└── <topic>/index.html  # Generated pages (do not edit by hand)
```

## Notes

This is an academic project, developed as a university assignment. It is public on GitHub for documentation purposes and is a **work in progress**.
