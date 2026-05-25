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
    <div className="">
      <main className="min-h-screen mx-auto max-w-xl divide-y py-6 border-x">
        {echoes.map((echo) => (
          <article
            key={echo.id}
            className="mx-auto  -full p-6"
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
              <div className="flex items-center gap-1 text-rose-300 hover:text-rose-400 cursor-pointer">
                <HeartIcon size={16} />
                <span>{echo.likeCount}</span>
              </div>
              <div className="flex items-center gap-1 text-green-300 hover:text-green-400 cursor-pointer">
                <MessageCircleIcon size={16} />
                <span>{echo.commentCount}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-300 hover:text-yellow-400 cursor-pointer">
                <Send size={16} />
                <span>{echo.shareCount}</span>
              </div>
              <div className="flex items-center gap-1 fill-sky-200 text-sky-300 hover:text-sky-400 cursor-pointer">
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
