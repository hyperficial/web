import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

// This route runs on the Worker. Everything else on the site is static.
export const prerender = false

const limits = { name: 100, email: 254, message: 5000, token: 2048 }

const json = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	})

/** Header values must be a single line */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

const escapeHtml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Ask Cloudflare whether this Turnstile token is real, unexpired and unused */
async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
			signal: AbortSignal.timeout(5000),
		})
		const result = (await response.json()) as { success?: boolean }
		return result.success === true
	} catch (error) {
		console.error('turnstile verify failed', (error as Error).message)
		return false
	}
}

export const POST: APIRoute = async ({ request }) => {
	// Only accept posts from this site (browsers always send Origin on a cross-site POST)
	const origin = request.headers.get('origin')
	if (origin) {
		if (origin !== new URL(request.url).origin) return json({ ok: false, error: 'forbidden' }, 403)
	}

	let data: Record<string, unknown>
	try {
		data = await request.json()
	} catch {
		return json({ ok: false, error: 'invalid' }, 400)
	}

	// Honeypot: bots fill the hidden field. Pretend it worked, send nothing.
	if (typeof data.website === 'string' && data.website.trim() !== '') return json({ ok: true })

	const name = String(data.name ?? '').trim()
	const email = String(data.email ?? '').trim()
	const message = String(data.message ?? '').trim()
	const token = String(data.turnstileToken ?? '')

	if (
		name.length < 2 ||
		name.length > limits.name ||
		email.length > limits.email ||
		!/^\S+@\S+\.\S+$/.test(email) ||
		message.length < 10 ||
		message.length > limits.message ||
		data.consent !== true
	) {
		return json({ ok: false, error: 'invalid' }, 422)
	}

	if (!env.CONTACT_TO || !env.TURNSTILE_SECRET) {
		console.error('CONTACT_TO or TURNSTILE_SECRET is not set')
		return json({ ok: false, error: 'unavailable' }, 503)
	}

	// Rate limit per visitor. Counts only well formed attempts, before the costlier checks.
	const ip = request.headers.get('cf-connecting-ip')
	const { success: allowed } = await env.CONTACT_LIMIT.limit({ key: ip ?? 'unknown' })
	if (!allowed) return json({ ok: false, error: 'rate_limited' }, 429)

	// Bot check
	if (!token || token.length > limits.token || !(await verifyTurnstile(token, ip))) {
		return json({ ok: false, error: 'bot_check' }, 403)
	}

	try {
		const sent = await env.EMAIL.send({
			to: env.CONTACT_TO,
			from: { email: `website@${new URL(request.url).hostname.replace(/^www\./, '')}`, name: 'Website contact' },
			replyTo: { email, name: oneLine(name) },
			subject: `Website message from ${oneLine(name)}`,
			text: `${message}\n\n${oneLine(name)}\n${email}`,
			html: `<p style="white-space:pre-wrap">${escapeHtml(message)}</p><p><strong>${escapeHtml(oneLine(name))}</strong><br>${escapeHtml(email)}</p>`,
		})
		// The id lets a message be looked up in Cloudflare's email sending records if it goes missing
		console.log('contact email accepted', sent?.messageId)
	} catch (error) {
		console.error('send failed', (error as { code?: string }).code, (error as Error).message)
		return json({ ok: false, error: 'send_failed' }, 502)
	}

	return json({ ok: true })
}
