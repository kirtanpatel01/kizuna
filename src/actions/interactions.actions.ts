"use server"

import { createServerFn } from "@tanstack/react-start"
import { and, desc, eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { recordPostEngagement } from "@/lib/leaderboard"
import { echo, echoInteraction, user } from "@/lib/schema"
import type { FeedEcho } from "@/actions/feed.actions"

type InteractionKind = "like" | "save"

type EchoRow = {
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

function toFeedEcho(row: EchoRow): FeedEcho {
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

async function getViewerId() {
	const { getRequestHeaders } = await import("@tanstack/react-start/server")
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	return session?.user?.id ?? null
}

async function toggleInteractionState(echoId: string, type: InteractionKind) {
	const viewerId = await getViewerId()

	if (!viewerId) {
		throw new Error("Not authenticated")
	}

	const [existing] = await db
		.select({ id: echoInteraction.id })
		.from(echoInteraction)
		.where(
			and(
				eq(echoInteraction.echoId, echoId),
				eq(echoInteraction.userId, viewerId),
				eq(echoInteraction.type, type),
			),
		)
		.limit(1)

	let active = false
	let delta = 0

	if (existing) {
		await db
			.delete(echoInteraction)
			.where(eq(echoInteraction.id, existing.id))

		active = false
		delta = -1
	} else {
		const inserted = await db
			.insert(echoInteraction)
			.values({
				id: crypto.randomUUID(),
				echoId,
				userId: viewerId,
				type,
			})
			.onConflictDoNothing()
			.returning({ id: echoInteraction.id })

		if (inserted.length > 0) {
			active = true
			delta = 1
		} else {
			active = true
			delta = 0
		}
	}

	const [updatedEcho] = await db
		.update(echo)
		.set(
			type === "like"
				? {
					likeCount: sql<number>`greatest(${echo.likeCount} + ${delta}, 0)`,
				}
				: {
					saveCount: sql<number>`greatest(${echo.saveCount} + ${delta}, 0)`,
				},
		)
		.where(eq(echo.id, echoId))
		.returning({
			likeCount: echo.likeCount,
			saveCount: echo.saveCount,
			authorId: echo.authorId,
		})

	if (!updatedEcho) {
		throw new Error("Echo not found")
	}

	try {
		await recordPostEngagement({
			postId: echoId,
			authorId: updatedEcho.authorId,
			delta,
			type,
		})
	} catch (error) {
		console.error("Failed to update leaderboard for echo interaction", error)
	}

	return {
		success: true,
		echoId,
		type,
		active,
		likeCount: Number(updatedEcho.likeCount ?? 0),
		saveCount: Number(updatedEcho.saveCount ?? 0),
	}
}
export const toggleLike = createServerFn({ method: "POST" })
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
	.handler(async ({ data }) => toggleInteractionState(data.echoId, "like"))

export const toggleSave = createServerFn({ method: "POST" })
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
	.handler(async ({ data }) => toggleInteractionState(data.echoId, "save"))

export const getSavedEchoes = createServerFn({ method: "GET" }).handler(async () => {
	const viewerId = await getViewerId()

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
		.from(echoInteraction)
		.innerJoin(echo, eq(echo.id, echoInteraction.echoId))
		.innerJoin(user, eq(user.id, echo.authorId))
		.where(and(eq(echoInteraction.userId, viewerId), eq(echoInteraction.type, "save")))
		.orderBy(desc(echoInteraction.createdAt))

	return rows.map(toFeedEcho)
})
