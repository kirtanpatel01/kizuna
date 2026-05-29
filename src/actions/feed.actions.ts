import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, desc, eq, inArray } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { recordPostCreated, recordPostDeleted } from "@/lib/leaderboard"
import { echo, echoInteraction, user } from "@/lib/schema"

const MAX_ECHO_LENGTH = 280

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

function toFeedEcho(
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

async function applyViewerInteractionState(echoes: FeedEcho[]) {
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

export const createEcho = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const content = typeof payload.content === "string" ? payload.content.trim() : ""

		if (!content) {
			throw new Error("Echo content is required")
		}

		if (content.length > MAX_ECHO_LENGTH) {
			throw new Error(`Echo content must be ${MAX_ECHO_LENGTH} characters or fewer`)
		}

		return { content }
	})
	.handler(async ({ data }) => {
		const headers = getRequestHeaders()
		const session = await auth.api.getSession({ headers })
		const userId = session?.user?.id

		if (!userId) {
			throw new Error("Not authenticated")
		}

		const echoId = crypto.randomUUID()

		await db.insert(echo).values({
			id: echoId,
			content: data.content,
			authorId: userId,
		})

		try {
			await recordPostCreated(echoId, userId)
		} catch (error) {
			console.error("Failed to initialize leaderboard state for echo", error)
		}

		const [inserted] = await db
			.select({
				id: echo.id,
				content: echo.content,
				createdAt: echo.createdAt,
				likeCount: echo.likeCount,
				commentCount: echo.commentCount,
				shareCount: echo.shareCount,
				saveCount: echo.saveCount,
				authorName: user.name,
				authorUsername: user.username,
				authorImage: user.image,
			})
			.from(echo)
			.innerJoin(user, eq(user.id, echo.authorId))
			.where(eq(echo.id, echoId))
			.limit(1)

		if (!inserted) {
			throw new Error("Failed to create echo")
		}

		return toFeedEcho(inserted)
	})

	export const updateEcho = createServerFn({ method: "POST" })
		.inputValidator((input) => {
			if (!input || typeof input !== "object") {
				throw new Error("Invalid input")
			}

			const payload = input as Record<string, unknown>
			const echoId = typeof payload.echoId === "string" ? payload.echoId.trim() : ""
			const content = typeof payload.content === "string" ? payload.content.trim() : ""

			if (!echoId) {
				throw new Error("Echo ID is required")
			}

			if (!content) {
				throw new Error("Echo content is required")
			}

			if (content.length > MAX_ECHO_LENGTH) {
				throw new Error(`Echo content must be ${MAX_ECHO_LENGTH} characters or fewer`)
			}

			return { echoId, content }
		})
		.handler(async ({ data }) => {
			const headers = getRequestHeaders()
			const session = await auth.api.getSession({ headers })
			const userId = session?.user?.id

			if (!userId) {
				throw new Error("Not authenticated")
			}

			const [updated] = await db
				.update(echo)
				.set({ content: data.content })
				.where(and(eq(echo.id, data.echoId), eq(echo.authorId, userId)))
				.returning({
					id: echo.id,
					content: echo.content,
					createdAt: echo.createdAt,
					likeCount: echo.likeCount,
					commentCount: echo.commentCount,
					shareCount: echo.shareCount,
					saveCount: echo.saveCount,
				})

			if (!updated) {
				throw new Error("Echo not found or not authorized")
			}

			const [author] = await db
				.select({
					name: user.name,
					username: user.username,
					image: user.image,
				})
				.from(user)
				.where(eq(user.id, userId))
				.limit(1)

			return toFeedEcho({
				...updated,
				authorName: author?.name ?? "Unknown",
				authorUsername: author?.username ?? "unknown",
				authorImage: author?.image ?? null,
			})
		})

	export const getEchoById = createServerFn({ method: "GET" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const echoId = typeof payload.echoId === "string" ? payload.echoId.trim() : ""

		if (!echoId) {
			throw new Error("Echo ID is required")
		}

		return { echoId }
	})
	.handler(async ({ data }) => {
		const [row] = await db
			.select({
				id: echo.id,
				content: echo.content,
				createdAt: echo.createdAt,
				likeCount: echo.likeCount,
				commentCount: echo.commentCount,
				shareCount: echo.shareCount,
				saveCount: echo.saveCount,
				authorName: user.name,
				authorUsername: user.username,
				authorImage: user.image,
			})
			.from(echo)
			.innerJoin(user, eq(user.id, echo.authorId))
			.where(eq(echo.id, data.echoId))
			.limit(1)

		if (!row) {
			return null
		}

		const [echoWithState] = await applyViewerInteractionState([toFeedEcho(row)])

		return echoWithState ?? null
	})

	export const deleteEcho = createServerFn({ method: "POST" })
		.inputValidator((input) => {
			if (!input || typeof input !== "object") {
				throw new Error("Invalid input")
			}

			const payload = input as Record<string, unknown>
			const echoId = typeof payload.echoId === "string" ? payload.echoId.trim() : ""

			if (!echoId) {
				throw new Error("Echo ID is required")
			}

			return { echoId }
		})
		.handler(async ({ data }) => {
			const headers = getRequestHeaders()
			const session = await auth.api.getSession({ headers })
			const userId = session?.user?.id

			if (!userId) {
				throw new Error("Not authenticated")
			}

			const [deleted] = await db
				.delete(echo)
				.where(and(eq(echo.id, data.echoId), eq(echo.authorId, userId)))
				.returning({ id: echo.id })

			if (!deleted) {
				throw new Error("Echo not found or not authorized")
			}

			try {
				await recordPostDeleted(deleted.id, userId)
			} catch (error) {
				console.error("Failed to remove echo from leaderboard", error)
			}

			return { success: true, echoId: deleted.id }
		})

export const getPostedEchoes = createServerFn({ method: "GET" }).handler(async () => {
	const rows = await db
		.select({
			id: echo.id,
			content: echo.content,
			createdAt: echo.createdAt,
			likeCount: echo.likeCount,
			commentCount: echo.commentCount,
			shareCount: echo.shareCount,
			saveCount: echo.saveCount,
			authorName: user.name,
			authorUsername: user.username,
			authorImage: user.image,
		})
		.from(echo)
		.innerJoin(user, eq(user.id, echo.authorId))
		.orderBy(desc(echo.createdAt))

	return applyViewerInteractionState(rows.map(toFeedEcho))
})

export const getMyPostedEchoes = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	const userId = session?.user?.id

	if (!userId) {
		return []
	}

	const rows = await db
		.select({
			id: echo.id,
			content: echo.content,
			createdAt: echo.createdAt,
			likeCount: echo.likeCount,
			commentCount: echo.commentCount,
			shareCount: echo.shareCount,
			saveCount: echo.saveCount,
			authorName: user.name,
			authorUsername: user.username,
			authorImage: user.image,
		})
		.from(echo)
		.innerJoin(user, eq(user.id, echo.authorId))
		.where(eq(echo.authorId, userId))
		.orderBy(desc(echo.createdAt))

	return applyViewerInteractionState(rows.map(toFeedEcho))
})

export const getEchoesByUsername = createServerFn({ method: "GET" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const username = typeof payload.username === "string" ? payload.username.trim() : ""

		if (!username) {
			throw new Error("Username is required")
		}

		return { username }
	})
	.handler(async ({ data }) => {
		const rows = await db
			.select({
				id: echo.id,
				content: echo.content,
				createdAt: echo.createdAt,
				likeCount: echo.likeCount,
				commentCount: echo.commentCount,
				shareCount: echo.shareCount,
				saveCount: echo.saveCount,
				authorName: user.name,
				authorUsername: user.username,
				authorImage: user.image,
			})
			.from(echo)
			.innerJoin(user, eq(user.id, echo.authorId))
			.where(eq(user.username, data.username))
			.orderBy(desc(echo.createdAt))

		return applyViewerInteractionState(rows.map(toFeedEcho))
	})
