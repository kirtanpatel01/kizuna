import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPublicProfile } from "@/actions/profile.action"
import { Separator } from "@/components/ui/separator"
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react"

const mockPosts = [
  {
    id: "post-1",
    content:
      "Shipping the public profile view today. Keeping the surface small and focused.",
    createdAtLabel: "2h ago",
  },
  {
    id: "post-2",
    content:
      "The feed is still mocked for now, but the layout is ready for live echoes later.",
    createdAtLabel: "Yesterday",
  },
  {
    id: "post-3",
    content:
      "Public profiles should feel quick: clear identity, counts, and a readable timeline.",
    createdAtLabel: "3 days ago",
  },
]

export const Route = createFileRoute("/$userId")({
  loader: async ({ params }) =>
    getPublicProfile({ data: { userId: params.userId } }),
  component: RouteComponent,
})

function RouteComponent() {
  const profile = Route.useLoaderData()
  const displayName = profile?.name?.trim() || "Not provided"
  const username = profile?.username?.trim() || "Not provided"
  const bio = profile?.bio?.trim() || "Not provided"
  const followersCount = profile?.followersCount
  const followingCount = profile?.followingCount
  const hasImage = Boolean(profile?.image)
  const initials =
    profile?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {hasImage ? (
                  <img
                    src={profile?.image ?? ""}
                    alt={displayName}
                    className="size-14 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full border bg-secondary text-lg font-semibold text-secondary-foreground">
                    {initials}
                  </div>
                )}

                <div>
                  <CardTitle className="text-2xl">{displayName}</CardTitle>
                  <CardDescription>@{username}</CardDescription>
                </div>
              </div>

              <Button>Follow</Button>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{bio}</p>

            <div className="flex w-full gap-4">
              <div className="flex-1 border bg-muted/40 p-4">
                <div className="text-2xl font-semibold">
                  {followersCount ?? "Not provided"}
                </div>
                <div className="text-xs tracking-wide text-muted-foreground">
                  Followers
                </div>
              </div>

              <div className="flex-1 border bg-muted/40 p-4">
                <div className="text-2xl font-semibold">
                  {followingCount ?? "Not provided"}
                </div>
                <div className="text-xs tracking-wide text-muted-foreground">
                  Following
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 lg:grid-cols-2">
              {mockPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col border border-border/70 bg-background/80"
                >
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="text-rose-400 text-sm flex items-center gap-0.5">
                        <Heart size={14} />
                        <span>12</span>
                      </div>
                      <div className="text-green-400 text-sm flex items-center gap-0.5">
                        <MessageCircle size={14} />
                        <span>3</span>
                      </div>
                      <div className="text-yellow-400 text-sm flex items-center gap-0.5">
                        <Send size={14} />
                        <span>6</span>
                      </div>
                      <div className="text-sky-400 text-sm flex items-center gap-0.5">
                        <Bookmark size={14} />
                        <span>1</span>
                      </div>
                    </div>
                    <span className="self-end text-xs text-muted-foreground">
                      {post.createdAtLabel}
                    </span>
                  </div>
                  <Separator />
                  <p className="p-3 text-sm leading-6 text-foreground/90">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
