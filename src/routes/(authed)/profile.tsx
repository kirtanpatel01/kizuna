import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { type FeedEcho } from "@/actions/feed.utils"
import { UserInfo } from "@/components/profile/user-info"
import { UserFeed } from "@/components/profile/user-feed"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentUser } from "@/actions/auth.actions"
import { getProfile, getPublicProfile } from "@/actions/profile.action"
import { getMyPostedEchoes } from "@/actions/feed.read.actions"
import { getSavedEchoes } from "@/actions/interactions.actions"

export const Route = createFileRoute("/(authed)/profile")({
  head: () => ({
    meta: [
      {
        title: "My profile | Greem",
      },
      {
        name: "description",
        content: "Review your profile echoes, avatar, and account information on Greem.",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  loader: async () => {
    const user = await getCurrentUser()

    if (!user?.username) {
      return {
        user: null,
        profile: null,
        publicProfile: null,
        postedEchoes: [],
        savedEchoes: [],
      }
    }

    const [profile, publicProfile, postedEchoes, savedEchoes] = await Promise.all([
      getProfile(),
      getPublicProfile({ data: { username: user.username } }),
      getMyPostedEchoes(),
      getSavedEchoes(),
    ])

    return {
      user,
      profile,
      publicProfile,
      postedEchoes,
      savedEchoes,
    }
  },
  component: RouteComponent,
})

function ProfileContent() {
  const { user, profile, publicProfile, postedEchoes, savedEchoes } = Route.useLoaderData()
  const [postedList, setPostedList] = useState<FeedEcho[]>(postedEchoes)
  const [savedList] = useState<FeedEcho[]>(savedEchoes)

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
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

  const handleEchoCreated = (echo: FeedEcho) => {
    setPostedList((current) => [echo, ...current])
  }

  return (
    <div className="p-2 sm:p-6">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <UserInfo
          displayName={displayName}
          username={username}
          image={image}
          profile={publicProfile}
          initialProfile={profile}
          onEchoCreated={handleEchoCreated}
        />
        <UserFeed
          postedEchoes={postedList}
          savedEchoes={savedList}
          onPostedEchoUpdated={(updated) => {
            setPostedList((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            )
          }}
          onPostedEchoDeleted={(echoId) => {
            setPostedList((current) => current.filter((item) => item.id !== echoId))
          }}
        />
      </div>
    </div>
  )
}

function RouteComponent() {
  return <ProfileContent />
}
