import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { echo, follow, user } from "@/lib/schema"

import { applyViewerInteractionState, toFeedEcho } from "./feed.utils"

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

export const getFollowingEchoes = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	const viewerId = session?.user?.id

	if (!viewerId) {
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
		.innerJoin(follow, eq(follow.followingId, user.id))
		.where(eq(follow.followerId, viewerId))
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