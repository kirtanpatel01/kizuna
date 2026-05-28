import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { type FeedEcho } from "@/actions/feed.actions"
import { toggleLike, toggleSave } from "@/actions/interactions.actions"

type UseFeedResult = {
	echoes: FeedEcho[]
	pendingLikeIds: Set<string>
	pendingSaveIds: Set<string>
	handleLike: (echoId: string) => void
	handleSave: (echoId: string) => void
}

export function useFeed(initialEchoes: FeedEcho[]): UseFeedResult {
	const [echoes, setEchoes] = useState<FeedEcho[]>(initialEchoes)
	const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set())
	const [pendingSaveIds, setPendingSaveIds] = useState<Set<string>>(new Set())

	const likeMutation = useMutation({
		mutationFn: async (echoId: string) => toggleLike({ data: { echoId } }),
		onMutate: async (echoId) => {
			let previousEchoes: FeedEcho[] = []

			setPendingLikeIds((current) => new Set(current).add(echoId))

			setEchoes((current) => {
				previousEchoes = current

				return current.map((echo) => {
					if (echo.id !== echoId) return echo

					const nextLiked = !Boolean(echo.isLiked)
					const nextLikeCount = Math.max(echo.likeCount + (nextLiked ? 1 : -1), 0)

					return {
						...echo,
						isLiked: nextLiked,
						likeCount: nextLikeCount,
					}
				})
			})

			return { previousEchoes, echoId }
		},
		onSuccess: (result) => {
			setEchoes((current) =>
				current.map((echo) =>
					echo.id === result.echoId
						? {
							...echo,
							likeCount: result.likeCount,
							isLiked: result.active,
						}
						: echo,
				),
			)
		},
		onError: (_error, _echoId, context) => {
			if (context?.previousEchoes) {
				setEchoes(context.previousEchoes)
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
			let previousEchoes: FeedEcho[] = []

			setPendingSaveIds((current) => new Set(current).add(echoId))

			setEchoes((current) => {
				previousEchoes = current
				return current.map((echo) => {
					if (echo.id !== echoId) return echo

					const nextSaved = !Boolean(echo.isSaved)
					const nextSaveCount = Math.max(echo.saveCount + (nextSaved ? 1 : -1), 0)

					return {
						...echo,
						isSaved: nextSaved,
						saveCount: nextSaveCount,
					}
				})
			})

			return { previousEchoes, echoId }
		},
		onSuccess: (result) => {
			setEchoes((current) =>
				current.map((echo) =>
					echo.id === result.echoId
						? {
							...echo,
							saveCount: result.saveCount,
							isSaved: result.active,
						}
						: echo,
				),
			)
		},
		onError: (_error, _echoId, context) => {
			if (context?.previousEchoes) {
				setEchoes(context.previousEchoes)
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
		echoes,
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
