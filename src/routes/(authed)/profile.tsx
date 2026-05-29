import { createFileRoute } from "@tanstack/react-router"
import { UserInfo } from "@/components/profile/user-info"
import { UserFeed } from "@/components/profile/user-feed"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AccountProvider } from "@/providers/account-provider"
import { getCurrentUser } from "@/actions/auth.actions"

export const Route = createFileRoute("/(authed)/profile")({
  loader: async () => {
    const user = await getCurrentUser()
    return { user }
  },
  component: RouteComponent,
})

function ProfileContent() {
  const { user } = Route.useLoaderData()

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Sign in to view your profile echoes.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const displayName = user.name?.trim() || "User"
  const username = user.username?.trim() || ""
  const image = user.image

  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <UserInfo
          displayName={displayName}
          username={username}
          image={image}
        />
        <UserFeed />
      </div>
    </div>
  )
}

function RouteComponent() {
  return (
    <AccountProvider>
      <ProfileContent />
    </AccountProvider>
  )
}
