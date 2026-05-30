export type FeedEcho = {
	id: string
	content: string
	createdAtLabel: string
	authorName: string
	authorUsername: string
	authorImage?: string | null
	likeCount: number
	commentCount: number
	shareCount: number
	saveCount: number
	isLiked?: boolean
	isSaved?: boolean
}

function formatCreatedAtLabel(createdAt: Date | string | null | undefined) {
	if (!createdAt) return "now"

	const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
	const time = date.getTime()

	if (Number.isNaN(time)) return "now"

	const diffMs = Date.now() - time
	const minuteMs = 60 * 1000
	const hourMs = 60 * minuteMs
	const dayMs = 24 * hourMs

	if (diffMs < minuteMs) return "now"
	if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)}m`
	if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}h`
	return `${Math.floor(diffMs / dayMs)}d`
}

export function toFeedEcho(
	row: {
		id: string
		content: string
		createdAt: Date
		likeCount: number
		commentCount: number
		shareCount: number
		saveCount: number
		authorName: string
		authorUsername: string | null
		authorImage: string | null
	},
): FeedEcho {
	return {
		id: row.id,
		content: row.content,
		createdAtLabel: formatCreatedAtLabel(row.createdAt),
		authorName: row.authorName,
		authorUsername: row.authorUsername ?? "unknown",
		authorImage: row.authorImage,
		likeCount: row.likeCount,
		commentCount: row.commentCount,
		shareCount: row.shareCount,
		saveCount: row.saveCount,
	}
}