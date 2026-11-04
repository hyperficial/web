import { getCollection, type CollectionEntry } from 'astro:content'

export type Project = CollectionEntry<'projects'>

/** Base path of the project pages. They live under /v while they are a preview. */
export const projectsBase = '/v/projects'

export const projectHref = (p: Project) => `${projectsBase}/${p.id}`

/** Published projects, featured first, then newest first. */
export async function getProjects(): Promise<Project[]> {
	const all = await getCollection('projects', (p) => !p.data.draft)
	return all.sort(
		(a, b) => Number(b.data.featured) - Number(a.data.featured) || b.data.date.valueOf() - a.data.date.valueOf(),
	)
}

export const statusLabel: Record<Project['data']['status'], string> = {
	idea: 'Idea',
	building: 'Building',
	shipped: 'Shipped',
	archived: 'Archived',
}

export const formatYear = (d: Date) => String(d.getUTCFullYear())
export const formatDate = (d: Date) =>
	d.toLocaleDateString('en', { year: 'numeric', month: 'long', timeZone: 'UTC' })
