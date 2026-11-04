/** Responsive widths up to the source width, so an image is never scaled up. */
export function widthsFor(sourceWidth: number, candidates: number[]): number[] {
	const fit = candidates.filter((w) => w < sourceWidth)
	return [...fit, sourceWidth]
}
