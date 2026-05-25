import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const MOCK_FOLLOWERS = [
  { id: "u1", name: "Mira Chen", username: "mira", image: undefined },
  { id: "u2", name: "Noah Kim", username: "noah", image: undefined },
  { id: "u3", name: "Isha Rao", username: "isha", image: undefined },
]

const MOCK_FOLLOWING = [
  { id: "u4", name: "Aarav Patel", username: "aarav", image: undefined },
  { id: "u5", name: "Lena Ortiz", username: "lena", image: undefined },
]

function UserRow({ name, username, image }: { name: string; username: string; image?: string | null }) {
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
        <div className="text-xs text-muted-foreground">@{username}</div>
      </div>
    </div>
  )
}

export function ProfileConnections() {
  const followersCount = MOCK_FOLLOWERS.length
  const followingCount = MOCK_FOLLOWING.length

  return (
    <Tabs defaultValue="followers">
      <TabsList className="w-full border-b">
        <TabsTrigger value="followers">Followers {followersCount}</TabsTrigger>
        <TabsTrigger value="following">Following {followingCount}</TabsTrigger>
      </TabsList>

      <div className="flex gap-4">
        <TabsContent value="followers">
          {MOCK_FOLLOWERS.map((u) => (
            <UserRow key={u.id} name={u.name} username={u.username} image={u.image} />
          ))}
        </TabsContent>

        <TabsContent value="following">
          {MOCK_FOLLOWING.map((u) => (
            <UserRow key={u.id} name={u.name} username={u.username} image={u.image} />
          ))}
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default ProfileConnections
