import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Send,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"

import { getPostedEchoes, type FeedEcho } from "@/actions/feed.actions"
import { toggleLike, toggleSave } from "@/actions/interactions.actions"

export const Route = createFileRoute("/feed")({
  loader: async () => getPostedEchoes(),
  component: RouteComponent,
})

function RouteComponent() {
  const initialEchoes = Route.useLoaderData() as FeedEcho[]
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
            : echo
        )
      )
    },
    onError: (error, _echoId, context) => {
      if (context?.previousEchoes) {
        setEchoes(context.previousEchoes)
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update like"
      )
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
            : echo
        )
      )
    },
    onError: (error, _echoId, context) => {
      if (context?.previousEchoes) {
        setEchoes(context.previousEchoes)
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update save"
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-y-0 left-(--sidebar-width) right-0 z-0 hidden grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:grid">
        <div className="w-6 justify-self-end bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
        <div />
        <div className="w-6 justify-self-start bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col border-x border-border bg-background text-foreground divide-y divide-border">
        {echoes.map((echo) => (
          <article
            key={echo.id}
            className="w-full p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <Link
                to="/$username"
                params={{ username: echo.authorUsername }}
                className="flex items-center gap-2"
              >
                {echo.authorImage && (
                  <img
                    src={echo.authorImage}
                    alt={echo.authorName}
                    className="size-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-foreground/90">
                    {echo.authorName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    @{echo.authorUsername}
                  </div>
                </div>
              </Link>
                <div className="text-xs text-muted-foreground">
                  {echo.createdAtLabel}
                </div>
            </div>

            <p className="mb-6">{echo.content}</p>

            <footer className="mt-2 flex items-center justify-between text-sm">
              <button
                type="button"
                className={`flex items-center gap-1 transition-colors ${
                  echo.isLiked
                    ? "text-rose-500"
                    : "text-slate-500 hover:text-rose-500"
                }`}
                onClick={() => likeMutation.mutate(echo.id)}
                disabled={pendingLikeIds.has(echo.id)}
                aria-pressed={Boolean(echo.isLiked)}
              >
                <HeartIcon size={16} className={echo.isLiked ? "fill-current" : ""} />
                <span>{echo.likeCount}</span>
              </button>
              <div className="flex cursor-pointer items-center gap-1 text-slate-500 hover:text-blue-500">
                <MessageCircleIcon size={16} />
                <span>{echo.commentCount}</span>
              </div>
              <div className="flex cursor-pointer items-center gap-1 text-slate-500 hover:text-green-500">
                <Send size={16} />
                <span>{echo.shareCount}</span>
              </div>
              <button
                type="button"
                className={`flex items-center gap-1 transition-colors ${
                  echo.isSaved
                    ? "text-sky-500"
                    : "text-slate-500 hover:text-sky-500"
                }`}
                onClick={() => saveMutation.mutate(echo.id)}
                disabled={pendingSaveIds.has(echo.id)}
                aria-pressed={Boolean(echo.isSaved)}
              >
                <BookmarkIcon size={16} className={echo.isSaved ? "fill-current" : ""} />
                <span>{echo.saveCount}</span>
              </button>
            </footer>
          </article>
        ))}
      </main>
    </div>
  )
}
