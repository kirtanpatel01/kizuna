import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq, inArray } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { echoInteraction } from "@/lib/schema"

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

export async function applyViewerInteractionState(echoes: FeedEcho[]) {
	const echoIds = [...new Set(echoes.map((item) => item.id))].filter(Boolean)

	if (echoIds.length === 0) {
		return echoes.map((item) => ({
			...item,
			isLiked: false,
			isSaved: false,
		}))
	}

	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	const userId = session?.user?.id

	if (!userId) {
		return echoes.map((item) => ({
			...item,
			isLiked: false,
			isSaved: false,
		}))
	}

	const rows = await db
		.select({
			echoId: echoInteraction.echoId,
			type: echoInteraction.type,
		})
		.from(echoInteraction)
		.where(
			and(
				eq(echoInteraction.userId, userId),
				inArray(echoInteraction.echoId, echoIds),
				inArray(echoInteraction.type, ["like", "save"]),
			),
		)

	const stateByEchoId = new Map<string, { isLiked: boolean; isSaved: boolean }>()

	for (const echoId of echoIds) {
		stateByEchoId.set(echoId, { isLiked: false, isSaved: false })
	}

	for (const row of rows) {
		const existing = stateByEchoId.get(row.echoId) ?? {
			isLiked: false,
			isSaved: false,
		}

		if (row.type === "like") {
			existing.isLiked = true
		}

		if (row.type === "save") {
			existing.isSaved = true
		}

		stateByEchoId.set(row.echoId, existing)
	}

	return echoes.map((echo) => {
		const state = stateByEchoId.get(echo.id)

		return {
			...echo,
			isLiked: state?.isLiked ?? false,
			isSaved: state?.isSaved ?? false,
		}
	})
}