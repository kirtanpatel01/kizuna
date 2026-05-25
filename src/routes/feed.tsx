import { createFileRoute } from "@tanstack/react-router"
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Send,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { getPostedEchoes } from "@/actions/feed.actions"

export const Route = createFileRoute("/feed")({
  loader: async () => getPostedEchoes(),
  component: RouteComponent,
})

function RouteComponent() {
  const echoes = Route.useLoaderData()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-y-0 left-(--sidebar-width) right-0 z-0 hidden grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:grid">
        <div className="w-6 justify-self-end bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
        <div />
        <div className="w-6 justify-self-start bg-[repeating-linear-gradient(-45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[8px_8px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col border-x border-border bg-background text-foreground">
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
                <div className="flex cursor-pointer items-center gap-1 text-chart-1 hover:text-chart-1/80">
                <HeartIcon size={16} />
                <span>{echo.likeCount}</span>
              </div>
                <div className="flex cursor-pointer items-center gap-1 text-chart-2 hover:text-chart-2/80">
                <MessageCircleIcon size={16} />
                <span>{echo.commentCount}</span>
              </div>
                <div className="flex cursor-pointer items-center gap-1 text-chart-4 hover:text-chart-4/80">
                <Send size={16} />
                <span>{echo.shareCount}</span>
              </div>
                <div className="flex cursor-pointer items-center gap-1 fill-chart-3 text-chart-3 hover:text-chart-3/80">
                <BookmarkIcon size={16} />
                <span>{echo.saveCount}</span>
              </div>
            </footer>
          </article>
        ))}
      </main>
    </div>
  )
}
