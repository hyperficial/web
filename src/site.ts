/** Site wide facts, defined once. The email address is configuration, not code: set PUBLIC_CONTACT_EMAIL at build time. */
export const site = {
	name: 'Benjamin Surrey',
	email: import.meta.env.PUBLIC_CONTACT_EMAIL ?? 'contact@example.com',
} as const
