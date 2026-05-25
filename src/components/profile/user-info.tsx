import ProfileCard from "./profile-card"
import ProfileDetails from "./profile-details"
import ProfileConnections from "./profile-connections"
import { useProfile, type PublicProfileData } from "@/hooks/use-profile"

type Props = {
  displayName: string
  username: string
  image?: string | null
}

export function UserInfo({
  displayName,
  username,
  image,
}: Props) {
  const resolvedUsername = username.trim()
  const profileQuery = useProfile(resolvedUsername)
  const profile = profileQuery.data as PublicProfileData | null

  return (
    <div className="flex flex-col gap-4">
      <ProfileCard
        displayName={displayName}
        username={resolvedUsername || "username"}
        image={image}
      />

      <ProfileDetails />

      <ProfileConnections
        followers={profile?.followers}
        following={profile?.following}
        followersCount={profile?.followersCount}
        followingCount={profile?.followingCount}
        isLoading={profileQuery.isPending}
      />
    </div>
  )
}

export default UserInfo
