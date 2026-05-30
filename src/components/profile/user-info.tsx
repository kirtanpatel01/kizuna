import ProfileCard from "./profile-card"
import ProfileDetails from "./profile-details"
import ProfileConnections from "./profile-connections"
import { type PublicProfileData, type ProfileData } from "@/hooks/use-profile"
import { type FeedEcho } from "@/actions/feed.utils"

type Props = {
  displayName: string
  username: string
  image?: string | null
  profile: PublicProfileData | null
  initialProfile: ProfileData
  onEchoCreated?: (echo: FeedEcho) => void
}

export function UserInfo({
  displayName,
  username,
  image,
  profile,
  initialProfile,
  onEchoCreated,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileCard
        displayName={displayName}
        username={username || "username"}
        image={image}
        onEchoCreated={onEchoCreated}
      />

      <ProfileDetails initialProfile={initialProfile} />

      <ProfileConnections
        followers={profile?.followers ?? []}
        following={profile?.following ?? []}
        followersCount={profile?.followersCount}
        followingCount={profile?.followingCount}
        isLoading={false}
      />
    </div>
  )
}

export default UserInfo
