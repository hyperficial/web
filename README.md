# bsurrey

Personal site: an introduction, projects and a contact form. A static Astro site with one Cloudflare Worker route for the form.

## Stack

Astro, Tailwind CSS 4, Bun, Cloudflare Workers.

## Commands

```sh
bun install
bun run dev      # local development
bun run build    # production build into dist/
```

## Configuration

Secrets never live in this repository. Copy `.env.example` to `.env` for local development.
The contact form needs two runtime secrets on the Worker and one public build variable, see `.env.example`.
