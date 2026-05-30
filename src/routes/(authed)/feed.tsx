import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { BookmarkIcon, HeartIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"

import {
  getFollowingEchoes,
  getPostedEchoes,
} from "@/actions/feed.read.actions"
import { type FeedEcho } from "@/actions/feed.utils"
import { useFeedPanels } from "@/hooks/use-feed-panels"
import CommentSheet from "@/components/feed/comment-sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPostScore } from "@/lib/leaderboard"

export const Route = createFileRoute("/(authed)/feed")({
  head: () => ({
    meta: [
      {
        title: "Feed | Greem",
      },
      {
        name: "description",
        content: "Browse the latest posts from people you follow on Greem.",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  loader: async () => {
    const [followingEchoes, allEchoes] = await Promise.all([
      getFollowingEchoes(),
      getPostedEchoes(),
    ])

    return {
      followingEchoes,
      allEchoes,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const {
    followingEchoes: initialFollowingEchoes,
    allEchoes: initialAllEchoes,
  } = Route.useLoaderData() as {
    followingEchoes: FeedEcho[]
    allEchoes: FeedEcho[]
  }
  const [panel, setPanel] = useState<"following" | "score">("following")
  const {
    followingEchoes,
    allEchoes,
    pendingLikeIds,
    pendingSaveIds,
    handleLike,
    handleSave,
  } = useFeedPanels(initialFollowingEchoes, initialAllEchoes)
  const scoreSortedEchoes = useMemo(
    () =>
      [...allEchoes].sort((left, right) => {
        const scoreDelta = getPostScore(right) - getPostScore(left)
        if (scoreDelta !== 0) return scoreDelta

        return 0
      }),
    [allEchoes]
  )

  const activeEchoes = panel === "score" ? scoreSortedEchoes : followingEchoes

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-y-0 right-0 left-(--sidebar-width) z-0 hidden grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:grid">
        <div className="w-6 justify-self-end bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
        <div />
        <div className="w-6 justify-self-start bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col border-x border-border bg-background text-foreground">
        <Tabs
          value={panel}
          onValueChange={(value) => setPanel(value as "following" | "score")}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="score">Top</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="divide-y divide-border">
          {activeEchoes.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              {panel === "following"
                ? "No posts from people you follow yet."
                : "No posts available to rank yet."}
            </div>
          ) : null}

          {activeEchoes.map((echo, index) => (
            <article key={echo.id} className="w-full p-6">
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
                  {panel === "score"
                    ? `#${index + 1} • ${getPostScore(echo)} score`
                    : echo.createdAtLabel}
                </div>
              </div>

              <p className="mb-6">{echo.content}</p>

              <footer className="mt-2 flex items-center justify-end gap-10 text-sm">
                <button
                  type="button"
                  className={`flex items-center gap-1 ${
                    echo.isLiked
                      ? "text-rose-500"
                      : "text-slate-500 hover:text-rose-500"
                  }`}
                  onClick={() => handleLike(echo.id)}
                  disabled={pendingLikeIds.has(echo.id)}
                  aria-pressed={Boolean(echo.isLiked)}
                >
                  <HeartIcon
                    size={16}
                    className={echo.isLiked ? "fill-current" : ""}
                  />
                  <span>{echo.likeCount}</span>
                </button>
                <CommentSheet
                  echoId={echo.id}
                  commentCount={echo.commentCount}
                />
                <button
                  type="button"
                  className={`flex items-center gap-1 ${
                    echo.isSaved
                      ? "text-sky-500"
                      : "text-slate-500 hover:text-sky-500"
                  }`}
                  onClick={() => handleSave(echo.id)}
                  disabled={pendingSaveIds.has(echo.id)}
                  aria-pressed={Boolean(echo.isSaved)}
                >
                  <BookmarkIcon
                    size={16}
                    className={echo.isSaved ? "fill-current" : ""}
                  />
                  <span>{echo.saveCount}</span>
                </button>
              </footer>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
