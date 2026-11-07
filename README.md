[![Netlify Status](https://api.netlify.com/api/v1/badges/0becdd4c-ff9c-4a1c-abf7-6a9f6ffc5a27/deploy-status)](https://app.netlify.com/sites/ciberguard/deploys)

# Cybersecurity Docs

A documentation-style website that explains cybersecurity concepts for everyday users. It follows a "Technology for everyone" approach, aimed at people of all ages who have limited access to technology or want to improve their online safety skills.

🔗 **Live site:** https://ciberguard.netlify.app/

## Features

- Documentation-style layout for reading topics
- Responsive, mobile-first layout (off-canvas menu on phones, fixed sidebar on desktop)
- Hash routes (`#/phishing`, `#/referencias`) so links, reload and the browser back button work
- Light/dark theme (follows the system setting on first visit, then remembers the choice)
- Menu and cards are generated from `model/topics.json`; no icon CDN needed
- Topics and references stored as JSON data

## Tech Stack

- HTML5
- CSS3 (with animations)
- Vanilla JavaScript

## Getting Started

No build step is needed. Start a local server with live reload:

```bash
npm install
npm run live   # or any static server; opening index.html via file:// won't load the JSON
```

## Project Structure

```
├── index.html          # Main page
├── script.js           # Page behavior
├── css/
│   ├── style.css       # Styles
│   └── animations.css  # Animations
├── model/
│   ├── topics.json     # Cybersecurity topics
│   └── references.json # Sources and references
└── resources/          # Images and other assets
```

## Notes

This is an academic project, developed as a university assignment. It is public on GitHub for documentation purposes and is a **work in progress**.
