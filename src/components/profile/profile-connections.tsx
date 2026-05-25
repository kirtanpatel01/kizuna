import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

type ConnectionUser = {
  id: string
  name: string
  username: string | null
  image?: string | null
}

type Props = {
  followers?: ConnectionUser[]
  following?: ConnectionUser[]
  followersCount?: number
  followingCount?: number
  isLoading?: boolean
}

function UserRow({ name, username, image }: { name: string; username: string | null; image?: string | null }) {
  function getInitials(n: string) {
    if (!n.trim()) return "U"
    return n
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {image ? (
        <img src={image} alt={name} className="size-8 rounded-full border object-cover" />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full border bg-secondary font-medium text-secondary-foreground">
          {getInitials(name)}
        </div>
      )}

      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">@{username ?? "Not provided"}</div>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-2 text-sm text-muted-foreground">No {label} yet.</div>
}

function ConnectionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="size-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function ProfileConnections({
  followers = [],
  following = [],
  followersCount,
  followingCount,
  isLoading = false,
}: Props) {
  const followerTotal = followersCount ?? followers.length
  const followingTotal = followingCount ?? following.length

  return (
    <Tabs defaultValue="followers">
      <TabsList className="w-full border-b">
        <TabsTrigger value="followers" className="gap-2">
          <span>Followers</span>
          {isLoading ? <Skeleton className="h-4 w-8" /> : <span>{followerTotal}</span>}
        </TabsTrigger>
        <TabsTrigger value="following" className="gap-2">
          <span>Following</span>
          {isLoading ? <Skeleton className="h-4 w-8" /> : <span>{followingTotal}</span>}
        </TabsTrigger>
      </TabsList>

        <TabsContent value="followers">
          {isLoading ? (
            <div className="space-y-1 py-1">
              <ConnectionRowSkeleton />
              <ConnectionRowSkeleton />
              <ConnectionRowSkeleton />
            </div>
          ) : followers.length ? (
            followers.map((u) => (
              <UserRow key={u.id} name={u.name} username={u.username} image={u.image} />
            ))
          ) : (
            <EmptyState label="followers" />
          )}
        </TabsContent>

        <TabsContent value="following">
          {isLoading ? (
            <div className="space-y-1 py-1">
              <ConnectionRowSkeleton />
              <ConnectionRowSkeleton />
              <ConnectionRowSkeleton />
            </div>
          ) : following.length ? (
            following.map((u) => (
              <UserRow key={u.id} name={u.name} username={u.username} image={u.image} />
            ))
          ) : (
            <EmptyState label="following" />
          )}
        </TabsContent>
    </Tabs>
  )
}

export default ProfileConnections
