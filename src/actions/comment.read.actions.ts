"use server"

import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq, inArray } from "drizzle-orm"

import { buildCommentTree, getViewerId } from "@/lib/comment.shared"
import { db } from "@/lib/db"
import { commentLike, echo, echoComment, user } from "@/lib/schema"

type CommentThreadResult = {
	comments: ReturnType<typeof buildCommentTree>
	commentCount: number
}

export const getCommentsByEcho = createServerFn({ method: "GET" })
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
	.handler(async ({ data }): Promise<CommentThreadResult> => {
		const [echoRow] = await db
			.select({
				id: echo.id,
				commentCount: echo.commentCount,
			})
			.from(echo)
			.where(eq(echo.id, data.echoId))
			.limit(1)

		if (!echoRow) {
			throw new Error("Echo not found")
		}

		const viewerId = await getViewerId()

		const rows = await db
			.select({
				id: echoComment.id,
				echoId: echoComment.echoId,
				parentId: echoComment.parentId,
				authorId: echoComment.authorId,
				authorName: user.name,
				authorUsername: user.username,
				authorImage: user.image,
				echoAuthorId: echo.authorId,
				content: echoComment.content,
				createdAt: echoComment.createdAt,
				likeCount: echoComment.likeCount,
				replyCount: echoComment.replyCount,
			})
			.from(echoComment)
			.innerJoin(user, eq(user.id, echoComment.authorId))
			.innerJoin(echo, eq(echo.id, echoComment.echoId))
			.where(eq(echoComment.echoId, data.echoId))
			.orderBy(asc(echoComment.createdAt))

		const commentIds = rows.map((row) => row.id)
		const viewerLikedIds = new Set<string>()

		if (viewerId && commentIds.length > 0) {
			const likedRows = await db
				.select({
					commentId: commentLike.commentId,
				})
				.from(commentLike)
				.where(
					and(
						eq(commentLike.userId, viewerId),
						inArray(commentLike.commentId, commentIds),
					),
				)

			for (const row of likedRows) {
				viewerLikedIds.add(row.commentId)
			}
		}

		const comments = buildCommentTree(
			rows.map((row) => ({
				...row,
				viewerLiked: viewerLikedIds.has(row.id),
			})),
		)

		return {
			comments,
			commentCount: Number(echoRow.commentCount ?? 0),
		}
	})