import { createFileRoute } from "@tanstack/react-router"
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Send,
  ArrowLeftIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPostedEchoes, type FeedEcho } from "@/actions/feed.actions"

export const Route = createFileRoute("/echo/$echoId")({
  loader: async ({ params }) => {
    const echoes = await getPostedEchoes()
    return echoes.find((e) => e.id === params.echoId) as FeedEcho | undefined
  },
  component: EchoDetailRoute,
})

function EchoDetailRoute() {
  const echo = Route.useLoaderData() as FeedEcho | undefined

  return <EchoDetailPage echo={echo} />
}

function EchoDetailPage({ echo }: { echo?: FeedEcho }) {
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
    } as const)

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
              {fallback.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fallback.authorImage}
                  alt={fallback.authorName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <div className="text-left">
                <CardTitle className="text-lg sm:text-xl">@{fallback.authorUsername}</CardTitle>
                <CardDescription className="text-sm">{fallback.authorName}</CardDescription>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">{fallback.createdAtLabel}</div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <p className="mx-auto max-w-lg text-lg leading-8 text-foreground sm:text-xl">
            {fallback.content}
          </p>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <ActionStack
              icon={HeartIcon}
              count={fallback.likeCount}
              label="Likes"
            />
            <ActionStack
              icon={MessageCircleIcon}
              count={fallback.commentCount}
              label="Comments"
            />
            <ActionStack
              icon={Send}
              count={fallback.shareCount}
              label="Shares"
            />
            <ActionStack
              icon={BookmarkIcon}
              count={fallback.saveCount}
              label="Saves"
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
}: {
  icon: typeof HeartIcon
  count: number
  label: string
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/50"
      aria-label={label}
    >
      <Icon size={20} />
      <span className="text-xs font-medium">{count}</span>
    </button>
  )
}
