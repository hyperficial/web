import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * Projects. One folder per project in src/content/projects/<slug>/ with an
 * index.mdx and any images next to it. The folder name is the URL slug.
 * Interactive HTML artifacts go in public/projects/<slug>/ and are embedded with <Artifact>.
 */
const projects = defineCollection({
	loader: glob({
		pattern: '*/index.{md,mdx}',
		base: './src/content/projects',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			/** One line for the card and the meta description */
			summary: z.string(),
			/** The big why: the reason the project exists. Shown large at the top of the page. */
			why: z.string(),
			/** When it started, or shipped. Sorts the list, newest first. */
			date: z.coerce.date(),
			status: z.enum(['idea', 'building', 'shipped', 'archived']).default('building'),
			role: z.string().optional(),
			stack: z.array(z.string()).default([]),
			cover: image().optional(),
			coverAlt: z.string().optional(),
			links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
			/** Shown first and larger in the list */
			featured: z.boolean().default(false),
			/** Made up to show the format. Marked with a Demo badge. */
			demo: z.boolean().default(false),
			/** Hidden from the list and not built */
			draft: z.boolean().default(false),
		}),
})

export const collections = { projects }
