import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  ArrowLeftIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEchoById, type FeedEcho } from "@/actions/feed.actions"
import { toggleLike, toggleSave } from "@/actions/interactions.actions"

export const Route = createFileRoute("/(authed)/echo/$echoId")({
  loader: async ({ params }) => {
    return getEchoById({ data: { echoId: params.echoId } })
  },
  component: EchoDetailRoute,
})

function EchoDetailRoute() {
  const echo = Route.useLoaderData() as FeedEcho | null

  return <EchoDetailPage echo={echo} />
}

function EchoDetailPage({ echo }: { echo?: FeedEcho | null }) {
  const fallback =
    echo ??
    ({
      id: "missing",
      content: "This echo no longer exists or has not been loaded yet.",
      createdAtLabel: "just now",
      authorName: "Unknown",
      authorUsername: "unknown",
      authorImage: undefined,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      saveCount: 0,
      isLiked: false,
      isSaved: false,
    } as const)

  const [currentEcho, setCurrentEcho] = useState(fallback)
  const [isLikePending, setIsLikePending] = useState(false)
  const [isSavePending, setIsSavePending] = useState(false)

  const likeMutation = useMutation({
    mutationFn: async (echoId: string) => toggleLike({ data: { echoId } }),
    onMutate: async () => {
      let previousEcho = currentEcho

      setIsLikePending(true)

      setCurrentEcho((state) => {
        previousEcho = state
        const nextLiked = !Boolean(state.isLiked)
        const nextLikeCount = Math.max(state.likeCount + (nextLiked ? 1 : -1), 0)

        return {
          ...state,
          isLiked: nextLiked,
          likeCount: nextLikeCount,
        }
      })

      return { previousEcho }
    },
    onSuccess: (result) => {
      setCurrentEcho((current) =>
        current
          ? {
              ...current,
              likeCount: result.likeCount,
              isLiked: result.active,
            }
          : current
      )
    },
    onError: (error, _echoId, context) => {
      if (context?.previousEcho) {
        setCurrentEcho(context.previousEcho)
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update like"
      )
    },
    onSettled: () => {
      setIsLikePending(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (echoId: string) => toggleSave({ data: { echoId } }),
    onMutate: async () => {
      let previousEcho = currentEcho

      setIsSavePending(true)

      setCurrentEcho((state) => {
        previousEcho = state
        const nextSaved = !Boolean(state.isSaved)
        const nextSaveCount = Math.max(state.saveCount + (nextSaved ? 1 : -1), 0)

        return {
          ...state,
          isSaved: nextSaved,
          saveCount: nextSaveCount,
        }
      })

      return { previousEcho }
    },
    onSuccess: (result) => {
      setCurrentEcho((current) =>
        current
          ? {
              ...current,
              saveCount: result.saveCount,
              isSaved: result.active,
            }
          : current
      )
    },
    onError: (error, _echoId, context) => {
      if (context?.previousEcho) {
        setCurrentEcho(context.previousEcho)
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update save"
      )
    },
    onSettled: () => {
      setIsSavePending(false)
    },
  })

  const isMissing = currentEcho.id === "missing"

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center">
      {(() => {
        const canGoBack =
          typeof window !== "undefined" && window.history.length > 1
        return (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-20"
            onClick={() => {
              if (canGoBack && typeof window !== "undefined") {
                try {
                  window.history.back()
                } catch (_) {
                  /* no-op */
                }
              }
            }}
            disabled={!canGoBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
          </Button>
        )
      })()}

      <Card className="w-full max-w-xl border-border/70 bg-background/95 text-center shadow-2xl backdrop-blur-xl">
        <CardHeader className="items-center">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              {currentEcho.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentEcho.authorImage ?? undefined}
                  alt={currentEcho.authorName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <div className="text-left">
                <CardTitle className="text-lg sm:text-xl">@{currentEcho.authorUsername}</CardTitle>
                <CardDescription className="text-sm">{currentEcho.authorName}</CardDescription>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">{currentEcho.createdAtLabel}</div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <p className="mx-auto max-w-lg text-lg leading-8 text-foreground sm:text-xl">
            {currentEcho.content}
          </p>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <ActionStack
              icon={HeartIcon}
              count={currentEcho.likeCount}
              label="Likes"
              active={Boolean(currentEcho.isLiked)}
              activeClassName="border-rose-500/30 bg-rose-500/10 text-rose-500"
              disabled={isMissing || isLikePending}
              onClick={() => likeMutation.mutate(currentEcho.id)}
            />
            <ActionStack
              icon={MessageCircleIcon}
              count={currentEcho.commentCount}
              label="Comments"
              disabled
            />
            <ActionStack
              icon={BookmarkIcon}
              count={currentEcho.saveCount}
              label="Saves"
              active={Boolean(currentEcho.isSaved)}
              activeClassName="border-sky-500/30 bg-sky-500/10 text-sky-500"
              disabled={isMissing || isSavePending}
              onClick={() => saveMutation.mutate(currentEcho.id)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ActionStack({
  icon: Icon,
  count,
  label,
  active = false,
  activeClassName = "border-primary/30 bg-primary/10 text-primary",
  disabled = false,
  onClick,
}: {
  icon: typeof HeartIcon
  count: number
  label: string
  active?: boolean
  activeClassName?: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-2  ${
        active
          ? activeClassName
          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
      }`}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={20} className={active ? "fill-current" : ""} />
      <span className="text-xs font-medium">{count}</span>
    </button>
  )
}
