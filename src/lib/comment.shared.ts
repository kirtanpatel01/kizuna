import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"

export type EchoCommentNode = {
	id: string
	echoId: string
	parentId: string | null
	authorId: string
	authorName: string
	authorUsername: string
	authorImage: string | null
	isEchoAuthor: boolean
	content: string
	createdAtLabel: string
	likeCount: number
	replyCount: number
	isLiked: boolean
	replies: EchoCommentNode[]
}

export function formatCreatedAtLabel(createdAt: Date | string | null | undefined) {
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

export async function getViewerId() {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	return session?.user?.id ?? null
}

export type CommentTreeRow = {
	id: string
	echoId: string
	parentId: string | null
	authorId: string
	authorName: string
	authorUsername: string | null
	authorImage: string | null
	echoAuthorId: string
	content: string
	createdAt: Date
	likeCount: number
	replyCount: number
	viewerLiked: boolean
}

export function buildCommentTree(rows: CommentTreeRow[]): EchoCommentNode[] {
	const nodes = new Map<string, EchoCommentNode>()
	const roots: EchoCommentNode[] = []

	for (const row of rows) {
		nodes.set(row.id, {
			id: row.id,
			echoId: row.echoId,
			parentId: row.parentId,
			authorId: row.authorId,
			authorName: row.authorName,
			authorUsername: row.authorUsername ?? "unknown",
			authorImage: row.authorImage,
			isEchoAuthor: row.authorId === row.echoAuthorId,
			content: row.content,
			createdAtLabel: formatCreatedAtLabel(row.createdAt),
			likeCount: row.likeCount,
			replyCount: row.replyCount,
			isLiked: row.viewerLiked,
			replies: [],
		})
	}

	for (const row of rows) {
		const node = nodes.get(row.id)
		if (!node) continue

		if (row.parentId) {
			const parent = nodes.get(row.parentId)
			if (parent) {
				parent.replies.push(node)
				continue
			}
		}

		roots.push(node)
	}

	return roots
}