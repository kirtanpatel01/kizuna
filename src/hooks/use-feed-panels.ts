import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { type FeedEcho } from "@/actions/feed.utils"
import { toggleLike, toggleSave } from "@/actions/interactions.actions"

type UseFeedPanelsResult = {
	followingEchoes: FeedEcho[]
	allEchoes: FeedEcho[]
	pendingLikeIds: Set<string>
	pendingSaveIds: Set<string>
	handleLike: (echoId: string) => void
	handleSave: (echoId: string) => void
}

function updateEchoList(
	echoes: FeedEcho[],
	echoId: string,
	updater: (echo: FeedEcho) => FeedEcho,
) {
	return echoes.map((echo) => (echo.id === echoId ? updater(echo) : echo))
}

export function useFeedPanels(
	initialFollowingEchoes: FeedEcho[],
	initialAllEchoes: FeedEcho[],
): UseFeedPanelsResult {
	const [followingEchoes, setFollowingEchoes] = useState<FeedEcho[]>(initialFollowingEchoes)
	const [allEchoes, setAllEchoes] = useState<FeedEcho[]>(initialAllEchoes)
	const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set())
	const [pendingSaveIds, setPendingSaveIds] = useState<Set<string>>(new Set())

	const likeMutation = useMutation({
		mutationFn: async (echoId: string) => toggleLike({ data: { echoId } }),
		onMutate: async (echoId) => {
			let previousFollowingEchoes: FeedEcho[] = []
			let previousAllEchoes: FeedEcho[] = []

			setPendingLikeIds((current) => new Set(current).add(echoId))

			setFollowingEchoes((current) => {
				previousFollowingEchoes = current

				return updateEchoList(current, echoId, (echo) => {
					const nextLiked = !Boolean(echo.isLiked)
					const nextLikeCount = Math.max(echo.likeCount + (nextLiked ? 1 : -1), 0)

					return {
						...echo,
						isLiked: nextLiked,
						likeCount: nextLikeCount,
					}
				})
			})

			setAllEchoes((current) => {
				previousAllEchoes = current

				return updateEchoList(current, echoId, (echo) => {
					const nextLiked = !Boolean(echo.isLiked)
					const nextLikeCount = Math.max(echo.likeCount + (nextLiked ? 1 : -1), 0)

					return {
						...echo,
						isLiked: nextLiked,
						likeCount: nextLikeCount,
					}
				})
			})

			return { previousFollowingEchoes, previousAllEchoes, echoId }
		},
		onSuccess: (result) => {
			setFollowingEchoes((current) =>
				updateEchoList(current, result.echoId, (echo) => ({
					...echo,
					likeCount: result.likeCount,
					isLiked: result.active,
				})),
			)
			setAllEchoes((current) =>
				updateEchoList(current, result.echoId, (echo) => ({
					...echo,
					likeCount: result.likeCount,
					isLiked: result.active,
				})),
			)
		},
		onError: (_error, _echoId, context) => {
			if (context?.previousFollowingEchoes) {
				setFollowingEchoes(context.previousFollowingEchoes)
			}

			if (context?.previousAllEchoes) {
				setAllEchoes(context.previousAllEchoes)
			}

			toast.error("Failed to update like")
		},
		onSettled: (_data, _error, echoId) => {
			setPendingLikeIds((current) => {
				const next = new Set(current)
				next.delete(echoId)
				return next
			})
		},
	})

	const saveMutation = useMutation({
		mutationFn: async (echoId: string) => toggleSave({ data: { echoId } }),
		onMutate: async (echoId) => {
			let previousFollowingEchoes: FeedEcho[] = []
			let previousAllEchoes: FeedEcho[] = []

			setPendingSaveIds((current) => new Set(current).add(echoId))

			setFollowingEchoes((current) => {
				previousFollowingEchoes = current
				return updateEchoList(current, echoId, (echo) => {
					const nextSaved = !Boolean(echo.isSaved)
					const nextSaveCount = Math.max(echo.saveCount + (nextSaved ? 1 : -1), 0)

					return {
						...echo,
						isSaved: nextSaved,
						saveCount: nextSaveCount,
					}
				})
			})

			setAllEchoes((current) => {
				previousAllEchoes = current
				return updateEchoList(current, echoId, (echo) => {
					const nextSaved = !Boolean(echo.isSaved)
					const nextSaveCount = Math.max(echo.saveCount + (nextSaved ? 1 : -1), 0)

					return {
						...echo,
						isSaved: nextSaved,
						saveCount: nextSaveCount,
					}
				})
			})

			return { previousFollowingEchoes, previousAllEchoes, echoId }
		},
		onSuccess: (result) => {
			setFollowingEchoes((current) =>
				updateEchoList(current, result.echoId, (echo) => ({
					...echo,
					saveCount: result.saveCount,
					isSaved: result.active,
				})),
			)
			setAllEchoes((current) =>
				updateEchoList(current, result.echoId, (echo) => ({
					...echo,
					saveCount: result.saveCount,
					isSaved: result.active,
				})),
			)
		},
		onError: (_error, _echoId, context) => {
			if (context?.previousFollowingEchoes) {
				setFollowingEchoes(context.previousFollowingEchoes)
			}

			if (context?.previousAllEchoes) {
				setAllEchoes(context.previousAllEchoes)
			}

			toast.error(
				_error instanceof Error ? _error.message : "Failed to update save",
			)
		},
		onSettled: (_data, _error, echoId) => {
			setPendingSaveIds((current) => {
				const next = new Set(current)
				next.delete(echoId)
				return next
			})
		},
	})

	return {
		followingEchoes,
		allEchoes,
		pendingLikeIds,
		pendingSaveIds,
		handleLike: (echoId) => {
			likeMutation.mutate(echoId)
		},
		handleSave: (echoId) => {
			saveMutation.mutate(echoId)
		},
	}
}