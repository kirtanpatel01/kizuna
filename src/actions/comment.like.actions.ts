"use server"

import { createServerFn } from "@tanstack/react-start"
import { and, eq, sql } from "drizzle-orm"

import { getViewerId } from "@/lib/comment.shared"
import { db } from "@/lib/db"
import { commentLike, echoComment } from "@/lib/schema"

export const toggleCommentLike = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const commentId = typeof payload.commentId === "string" ? payload.commentId.trim() : ""

		if (!commentId) {
			throw new Error("Comment ID is required")
		}

		return { commentId }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()

		if (!viewerId) {
			throw new Error("Not authenticated")
		}

		const [existing] = await db
			.select({ id: commentLike.id })
			.from(commentLike)
			.where(
				and(
					eq(commentLike.commentId, data.commentId),
					eq(commentLike.userId, viewerId),
				),
			)
			.limit(1)

		let active = false
		let delta = 0

		if (existing) {
			await db.delete(commentLike).where(eq(commentLike.id, existing.id))
			delta = -1
		} else {
			const inserted = await db
				.insert(commentLike)
				.values({
					id: crypto.randomUUID(),
					commentId: data.commentId,
					userId: viewerId,
				})
				.onConflictDoNothing()
				.returning({ id: commentLike.id })

			if (inserted.length > 0) {
				active = true
				delta = 1
			}
		}

		const [updatedComment] = await db
			.update(echoComment)
			.set({
				likeCount: sql<number>`greatest(${echoComment.likeCount} + ${delta}, 0)`,
			})
			.where(eq(echoComment.id, data.commentId))
			.returning({ likeCount: echoComment.likeCount })

		if (!updatedComment) {
			throw new Error("Comment not found")
		}

		return {
			success: true,
			commentId: data.commentId,
			active,
			likeCount: Number(updatedComment.likeCount ?? 0),
		}
	})