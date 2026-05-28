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
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { followUser, unfollowUser } from "@/actions/follow.actions"
import ProfileConnections from "@/components/profile/profile-connections"
import { getEchoesByUsername } from "@/actions/feed.actions"
import { BookmarkIcon, HeartIcon, MessageCircleIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const [profile, feed] = await Promise.all([
      getPublicProfile({ data: { username: params.username } }),
      getEchoesByUsername({ data: { username: params.username } }),
    ])

    return { profile, feed }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const { profile, feed } = Route.useLoaderData()
  const [profileState, setProfileState] = useState(profile)

  if (!profileState) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>
              The public profile for this username could not be loaded.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const followMutation = useMutation({
    mutationFn: async () => {
      const result = profileState.isFollowing
        ? await unfollowUser({ data: { username: params.username } })
        : await followUser({ data: { username: params.username } })

      if (!result?.success) {
        throw new Error(result?.message ?? "Failed to update follow state")
      }

      return result
    },
    onMutate: async () => {
      const previousProfile = profileState

      setProfileState((current) => {
        if (!current || current.isOwnProfile) {
          return current
        }

        const nextIsFollowing = !current.isFollowing
        const followersDelta = nextIsFollowing ? 1 : -1

        return {
          ...current,
          isFollowing: nextIsFollowing,
          followersCount: Math.max(current.followersCount + followersDelta, 0),
        }
      })

      return { previousProfile }
    },
    onSuccess: (result) => {
      toast.success(result.message ?? "Updated follow state")
    },
    onError: (error, _variables, context) => {
      if (context?.previousProfile) {
        setProfileState(context.previousProfile)
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update follow state"
      )
    },
    onSettled: async () => {
      const refreshedProfile = await getPublicProfile({
        data: { username: params.username },
      })

      if (refreshedProfile) {
        setProfileState(refreshedProfile)
      }
    },
  })

  const displayName = profileState?.name?.trim() || "Not provided"
  const username = profileState?.username?.trim() || "Not provided"
  const bio = profileState?.bio?.trim() || "Not provided"
  const hasImage = Boolean(profileState?.image)
  const initials =
    profileState?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {hasImage ? (
                    <img
                      src={profileState.image ?? ""}
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

                {!profileState.isOwnProfile ? (
                  <Button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    {profileState.isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                ) : null}
              </div>

              <p className="text-sm leading-6 text-muted-foreground">{bio}</p>
            </CardHeader>
          </Card>

          <ProfileConnections
            followers={profileState.followers}
            following={profileState.following}
            followersCount={profileState.followersCount}
            followingCount={profileState.followingCount}
          />
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Feed</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 lg:grid-cols-2">
                {feed.map((post) => (
                  <Link
                    to="/echo/$echoId"
                    params={{ echoId: post.id }}
                    key={post.id}
                  >
                    <div className="flex flex-col border border-border/70 bg-background/80 hover:bg-black">
                      <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Metric
                            icon={HeartIcon}
                            value={post.likeCount}
                            colorClassName="text-rose-400"
                          />
                          <Metric
                            icon={MessageCircleIcon}
                            value={post.commentCount}
                            colorClassName="text-green-400"
                          />
                          <Metric
                            icon={BookmarkIcon}
                            value={post.saveCount}
                            colorClassName="text-sky-400"
                          />
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
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  value,
  colorClassName,
}: {
  icon: typeof HeartIcon
  value: number
  colorClassName: string
}) {
  return (
    <div className={`flex items-center gap-0.5 text-sm ${colorClassName}`}>
      <Icon size={14} />
      <span>{value}</span>
    </div>
  )
}
