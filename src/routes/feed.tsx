import { createFileRoute } from "@tanstack/react-router"
import {
  BookmarkIcon,
  HeartIcon,
  Send,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { getPostedEchoes, type FeedEcho } from "@/actions/feed.actions"
import { useFeed } from "@/hooks/use-feed"
import CommentSheet from "@/components/feed/comment-sheet"

export const Route = createFileRoute("/feed")({
  loader: async () => getPostedEchoes(),
  component: RouteComponent,
})

function RouteComponent() {
  const initialEchoes = Route.useLoaderData() as FeedEcho[]
  const {
    echoes,
    pendingLikeIds,
    pendingSaveIds,
    handleLike,
    handleSave,
  } = useFeed(initialEchoes)

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
                onClick={() => handleLike(echo.id)}
                disabled={pendingLikeIds.has(echo.id)}
                aria-pressed={Boolean(echo.isLiked)}
              >
                <HeartIcon size={16} className={echo.isLiked ? "fill-current" : ""} />
                <span>{echo.likeCount}</span>
              </button>
              <CommentSheet echoId={echo.id} commentCount={echo.commentCount} />
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
                onClick={() => handleSave(echo.id)}
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
