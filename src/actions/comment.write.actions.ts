"use server"

import { createServerFn } from "@tanstack/react-start"
import { and, eq, sql } from "drizzle-orm"

import { formatCreatedAtLabel, getViewerId, type EchoCommentNode } from "@/lib/comment.shared"
import { db } from "@/lib/db"
import { echo, echoComment, user } from "@/lib/schema"

const MAX_COMMENT_LENGTH = 500

async function getOwnedComment(commentId: string) {
	const [comment] = await db
		.select({
			id: echoComment.id,
			echoId: echoComment.echoId,
			parentId: echoComment.parentId,
			authorId: echoComment.authorId,
		})
		.from(echoComment)
		.where(eq(echoComment.id, commentId))
		.limit(1)

	return comment ?? null
}

async function getCommentSubtreeIds(targetId: string, echoId: string) {
	const rows = await db
		.select({
			id: echoComment.id,
			parentId: echoComment.parentId,
		})
		.from(echoComment)
		.where(eq(echoComment.echoId, echoId))

	const childrenByParent = new Map<string, string[]>()

	for (const row of rows) {
		if (!row.parentId) continue

		const children = childrenByParent.get(row.parentId) ?? []
		children.push(row.id)
		childrenByParent.set(row.parentId, children)
	}

	const visited = new Set<string>()
	const stack = [targetId]

	while (stack.length > 0) {
		const currentId = stack.pop()
		if (!currentId || visited.has(currentId)) {
			continue
		}

		visited.add(currentId)
		stack.push(...(childrenByParent.get(currentId) ?? []))
	}

	return [...visited]
}

function mapCommentRowToNode(row: {
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
}): EchoCommentNode {
	return {
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
		likeCount: Number(row.likeCount ?? 0),
		replyCount: Number(row.replyCount ?? 0),
		isLiked: false,
		replies: [],
	}
}

export const createComment = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const echoId = typeof payload.echoId === "string" ? payload.echoId.trim() : ""
		const parentId =
			typeof payload.parentId === "string" && payload.parentId.trim()
				? payload.parentId.trim()
				: null
		const content = typeof payload.content === "string" ? payload.content.trim() : ""

		if (!echoId) {
			throw new Error("Echo ID is required")
		}

		if (!content) {
			throw new Error("Comment content is required")
		}

		if (content.length > MAX_COMMENT_LENGTH) {
			throw new Error(`Comment content must be ${MAX_COMMENT_LENGTH} characters or fewer`)
		}

		return { echoId, parentId, content }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()

		if (!viewerId) {
			throw new Error("Not authenticated")
		}

		const commentId = crypto.randomUUID()

		if (data.parentId) {
			const [parent] = await db
				.select({ id: echoComment.id, echoId: echoComment.echoId })
				.from(echoComment)
				.where(
					and(eq(echoComment.id, data.parentId), eq(echoComment.echoId, data.echoId)),
				)
				.limit(1)

			if (!parent) {
				throw new Error("Parent comment not found")
			}
		}

		await db.insert(echoComment).values({
			id: commentId,
			echoId: data.echoId,
			authorId: viewerId,
			parentId: data.parentId,
			content: data.content,
		})

		await db
			.update(echo)
			.set({
				commentCount: sql<number>`greatest(${echo.commentCount} + 1, 0)`,
			})
			.where(eq(echo.id, data.echoId))

		if (data.parentId) {
			await db
				.update(echoComment)
				.set({
					replyCount: sql<number>`greatest(${echoComment.replyCount} + 1, 0)`,
				})
				.where(eq(echoComment.id, data.parentId))
		}

		const [created] = await db
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
			.where(eq(echoComment.id, commentId))
			.limit(1)

		if (!created) {
			throw new Error("Failed to create comment")
		}

		return {
			comment: mapCommentRowToNode(created),
		}
	})

export const editComment = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const commentId = typeof payload.commentId === "string" ? payload.commentId.trim() : ""
		const content = typeof payload.content === "string" ? payload.content.trim() : ""

		if (!commentId) {
			throw new Error("Comment ID is required")
		}

		if (!content) {
			throw new Error("Comment content is required")
		}

		if (content.length > MAX_COMMENT_LENGTH) {
			throw new Error(`Comment content must be ${MAX_COMMENT_LENGTH} characters or fewer`)
		}

		return { commentId, content }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()

		if (!viewerId) {
			throw new Error("Not authenticated")
		}

		const comment = await getOwnedComment(data.commentId)

		if (!comment) {
			throw new Error("Comment not found")
		}

		if (comment.authorId !== viewerId) {
			throw new Error("You can only edit your own comments")
		}

		await db
			.update(echoComment)
			.set({
				content: data.content,
			})
			.where(eq(echoComment.id, data.commentId))

		const [updated] = await db
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
			.where(eq(echoComment.id, data.commentId))
			.limit(1)

		if (!updated) {
			throw new Error("Failed to update comment")
		}

		return {
			comment: mapCommentRowToNode(updated),
		}
	})

export const deleteComment = createServerFn({ method: "POST" })
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

		const comment = await getOwnedComment(data.commentId)

		if (!comment) {
			throw new Error("Comment not found")
		}

		if (comment.authorId !== viewerId) {
			throw new Error("You can only delete your own comments")
		}

		const subtreeIds = await getCommentSubtreeIds(comment.id, comment.echoId)
		const deletedCount = subtreeIds.length

		await db.delete(echoComment).where(eq(echoComment.id, comment.id))

		await db
			.update(echo)
			.set({
				commentCount: sql<number>`greatest(${echo.commentCount} - ${deletedCount}, 0)`,
			})
			.where(eq(echo.id, comment.echoId))

		if (comment.parentId) {
			await db
				.update(echoComment)
				.set({
					replyCount: sql<number>`greatest(${echoComment.replyCount} - 1, 0)`,
				})
				.where(eq(echoComment.id, comment.parentId))
		}

		return {
			success: true,
			commentId: data.commentId,
			deletedCount,
		}
	})