export const ENGAGEMENT_WEIGHTS = {
	like: 1,
	comment: 3,
	save: 5,
} as const

export function toNumber(value: string | number | null | undefined) {
	if (value === null || value === undefined || value === "") return 0
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : 0
}

export function getPostScore(row: {
	likeCount: number
	commentCount: number
	saveCount: number
}) {
	return (
		Number(row.likeCount ?? 0) * ENGAGEMENT_WEIGHTS.like +
		Number(row.commentCount ?? 0) * ENGAGEMENT_WEIGHTS.comment +
		Number(row.saveCount ?? 0) * ENGAGEMENT_WEIGHTS.save
	)
}

export function getNormalizedUserScore(totalPostScore: number, totalPosts: number) {
	return totalPostScore / Math.sqrt(totalPosts + 1)
}