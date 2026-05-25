import { createFileRoute, Link } from "@tanstack/react-router"
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Repeat2Icon,
  ArrowLeftIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEchoById } from "@/lib/echo-data"

export const Route = createFileRoute("/echo/$echoId")({
  component: EchoDetailRoute,
})

function EchoDetailRoute() {
  const { echoId } = Route.useParams()
  const echo = getEchoById(echoId)

  return <EchoDetailPage echo={echo} />
}

function EchoDetailPage({
  echo,
}: {
  echo?: ReturnType<typeof getEchoById>
}) {
  const fallback =
    echo ??
    ({
      id: "missing",
      content: "This echo no longer exists or has not been loaded yet.",
      createdAtLabel: "just now",
      authorName: "Unknown",
      authorUsername: "unknown",
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      saveCount: 0,
    } as const)

  return (
    <div className="relative min-h-svh w-full flex justify-center items-center">
      <Link to="/profile" className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="sm" className="justify-start px-2">
          <ArrowLeftIcon data-icon="inline-start" />
          Back to profile
        </Button>
      </Link>

      <div className="z-10">
        <Card className="w-full max-w-xl border-border/70 bg-background/95 text-center shadow-2xl backdrop-blur-xl">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl sm:text-3xl">@{fallback.authorUsername}</CardTitle>
            <CardDescription>
              {fallback.authorName} · {fallback.createdAtLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 px-6 pb-8 text-center">
            <p className="mx-auto max-w-lg text-lg leading-8 text-foreground sm:text-xl">
              {fallback.content}
            </p>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
              <ActionStack icon={HeartIcon} count={fallback.likeCount} label="Likes" />
              <ActionStack icon={MessageCircleIcon} count={fallback.commentCount} label="Comments" />
              <ActionStack icon={Repeat2Icon} count={fallback.shareCount} label="Shares" />
              <ActionStack icon={BookmarkIcon} count={fallback.saveCount} label="Saves" />
            </div>
          </CardContent>
        </Card>
      </div>
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
