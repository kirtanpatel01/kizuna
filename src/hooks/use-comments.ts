import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
	deleteComment,
	editComment,
	createComment,
	getCommentsByEcho,
	toggleCommentLike,
	type EchoCommentNode,
} from "@/actions/comment.actions"

type UseCommentsOptions = {
	echoId: string
	initialCommentCount?: number
}

type CreateCommentInput = {
	content: string
	parentId?: string | null
}

type EditCommentInput = {
	commentId: string
	content: string
}

type UseCommentsResult = {
	comments: EchoCommentNode[]
	commentCount: number
	isLoading: boolean
	isSubmitting: boolean
	pendingLikeIds: Set<string>
	createComment: (input: CreateCommentInput) => Promise<unknown>
	editComment: (input: EditCommentInput) => Promise<unknown>
	deleteComment: (commentId: string) => Promise<unknown>
	toggleCommentLike: (commentId: string) => void
	refreshComments: () => Promise<void>
}

function insertCommentNode(
	comments: EchoCommentNode[],
	comment: EchoCommentNode,
): EchoCommentNode[] {
	if (!comment.parentId) {
		return [...comments, comment]
	}

	let inserted = false

	const nextComments = comments.map((existing) => {
		if (existing.id === comment.parentId) {
			inserted = true

			return {
				...existing,
				replyCount: existing.replyCount + 1,
				replies: [...existing.replies, comment],
			}
		}

		const replies = insertCommentNode(existing.replies, comment)
		if (replies !== existing.replies) {
			inserted = true
			return {
				...existing,
				replies,
			}
		}

		return existing
	})

	if (!inserted) {
		return [...comments, comment]
	}

	return nextComments
}

function updateCommentNode(
	comments: EchoCommentNode[],
	commentId: string,
	updater: (comment: EchoCommentNode) => EchoCommentNode,
): EchoCommentNode[] {
	let changed = false

	const nextComments = comments.map((comment) => {
		if (comment.id === commentId) {
			changed = true
			return updater(comment)
		}

		const nextReplies = updateCommentNode(comment.replies, commentId, updater)
		if (nextReplies !== comment.replies) {
			changed = true
			return {
				...comment,
				replies: nextReplies,
			}
		}

		return comment
	})

	return changed ? nextComments : comments
}

export function useComments({
	echoId,
	initialCommentCount = 0,
}: UseCommentsOptions): UseCommentsResult {
	const [comments, setComments] = useState<EchoCommentNode[]>([])
	const [commentCount, setCommentCount] = useState(initialCommentCount)
	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set())

	const refreshComments = async () => {
		if (!echoId) {
			setComments([])
			setCommentCount(initialCommentCount)
			setIsLoading(false)
			return
		}

		setIsLoading(true)

		try {
			const result = await getCommentsByEcho({ data: { echoId } })
			setComments(result.comments)
			setCommentCount(result.commentCount)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load comments",
			)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void refreshComments()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [echoId])

	const createMutation = useMutation({
		mutationFn: async (input: CreateCommentInput) =>
			createComment({
				data: {
					echoId,
					content: input.content,
					parentId: input.parentId ?? null,
				},
			}),
		onMutate: async () => {
			setIsSubmitting(true)
		},
		onSuccess: (result) => {
			setComments((current) => insertCommentNode(current, result.comment))
			setCommentCount((current) => current + 1)
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to post comment",
			)
		},
		onSettled: () => {
			setIsSubmitting(false)
		},
	})

	const editMutation = useMutation({
		mutationFn: async (input: EditCommentInput) =>
			editComment({
				data: {
					commentId: input.commentId,
					content: input.content,
				},
			}),
		onSuccess: (result) => {
			setComments((current) =>
				updateCommentNode(current, result.comment.id, (comment) => ({
					...comment,
					content: result.comment.content,
				})),
			)
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update comment",
			)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: async (commentId: string) =>
			deleteComment({ data: { commentId } }),
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete comment",
			)
		},
		onSuccess: async () => {
			await refreshComments()
		},
	})

	const likeMutation = useMutation({
		mutationFn: async (commentId: string) =>
			toggleCommentLike({ data: { commentId } }),
		onMutate: async (commentId) => {
			let previousComments = comments

			setPendingLikeIds((current) => new Set(current).add(commentId))

			setComments((current) => {
				previousComments = current

				return updateCommentNode(current, commentId, (comment) => {
					const nextLiked = !comment.isLiked
					const nextLikeCount = Math.max(
						comment.likeCount + (nextLiked ? 1 : -1),
						0,
					)

					return {
						...comment,
						isLiked: nextLiked,
						likeCount: nextLikeCount,
					}
				})
			})

			return { previousComments, commentId }
		},
		onSuccess: (result) => {
			setComments((current) =>
				updateCommentNode(current, result.commentId, (comment) => ({
					...comment,
					isLiked: result.active,
					likeCount: result.likeCount,
				})),
			)
		},
		onError: (error, _commentId, context) => {
			if (context?.previousComments) {
				setComments(context.previousComments)
			}

			toast.error(
				error instanceof Error ? error.message : "Failed to update comment like",
			)
		},
		onSettled: (_data, _error, commentId) => {
			setPendingLikeIds((current) => {
				const next = new Set(current)
				next.delete(commentId)
				return next
			})
		},
	})

	return {
		comments,
		commentCount,
		isLoading,
		isSubmitting,
		pendingLikeIds,
		createComment: async (input) => {
			return createMutation.mutateAsync(input)
		},
		editComment: async (input) => {
			return editMutation.mutateAsync(input)
		},
		deleteComment: async (commentId) => {
			return deleteMutation.mutateAsync(commentId)
		},
		toggleCommentLike: (commentId) => {
			likeMutation.mutate(commentId)
		},
		refreshComments,
	}
}
