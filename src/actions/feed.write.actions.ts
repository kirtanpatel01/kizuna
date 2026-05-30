import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { recordPostCreated, recordPostDeleted } from "@/lib/leaderboard"
import { echo, user } from "@/lib/schema"

import { toFeedEcho } from "./feed.utils"

const MAX_ECHO_LENGTH = 280

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