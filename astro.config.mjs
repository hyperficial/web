// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'

// Pages are prerendered. Only src/pages/api/contact.ts runs on the Cloudflare Worker.
export default defineConfig({
	adapter: cloudflare(),
	integrations: [mdx()],
	markdown: {
		// Both themes are emitted as CSS variables, global.css picks one with the color scheme
		shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
	},
	vite: {
		plugins: [tailwindcss()],
	},
})
