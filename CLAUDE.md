# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The marketing website for Stratfor Capital (Alberta private lending), deployed on Cloudflare Pages. It is plain static HTML/CSS with a single serverless function — no build step, no package manager, no framework, no dependencies.

## Commands

There is no build, lint, or test tooling in this repo — there is nothing to compile.

- **Preview locally**: open any `.html` file directly in a browser, or serve the directory with any static file server (e.g. `npx serve .`). The `/api/submit` form endpoint (a Cloudflare Pages Function) will not work under a plain static server — only under Cloudflare Pages itself (`wrangler pages dev .`, if Wrangler is installed) or once deployed.
- **Deploy**: push to `main` on the `origin` GitHub remote (`kaptyminhas-source/stratforcapital`); Cloudflare Pages is presumed to auto-deploy from that branch (no CI workflow lives in this repo).

## Architecture

Each `.html` page (`index.html`, `bridge-financing.html`, `construction-loans.html`, `commercial-mortgages.html`, `bridge-financing-alberta-guide.html`, `privacy.html`, `terms.html`, `thank-you.html`, `404.html`, `card.html`) is a **fully self-contained document**: all CSS lives in a `<style>` block in its own `<head>`, and there is no shared stylesheet, template, or JS file. The navy/gold/cream design system (CSS custom properties like `--navy`, `--gold`, `--cream`) and the nav/footer markup are duplicated across pages rather than factored out.

**Consequence for edits**: a change to shared visual elements (nav links, footer, color tokens, fonts) must be repeated by hand in every page that has it — there is no single source of truth to edit once. `card.html` intentionally uses a different, unrelated color scheme/layout (it's a digital business card, not part of the main site design).

**Contact form flow**: the form in `index.html` posts to `/api/submit`, handled by `functions/api/submit.js` (a Cloudflare Pages Function using the `onRequestPost` convention). It validates required fields, checks a hidden honeypot field (`website_url`) for spam, sends the inquiry as an email via the Resend API (`RESEND_API_KEY` — a Cloudflare-side environment secret, not present in this repo), and redirects to `/thank-you` on success.

**Cloudflare Pages config files** (not application code, but control deployment behavior):
- `_headers` — sets security headers site-wide and per-path cache-control rules (e.g. `/card`, `/*.html`).
- `robots.txt` / `sitemap.xml` — maintained by hand; a new page needs a manual `sitemap.xml` entry to be discoverable.

**SEO/metadata pattern**: every page repeats a block of `<meta>` tags (canonical URL, Open Graph, Twitter card) and `index.html` additionally embeds a JSON-LD `FinancialService` schema block. When adding a new page, follow the existing meta-tag block from a similar page (e.g. one of the service pages) rather than inventing a new pattern.
