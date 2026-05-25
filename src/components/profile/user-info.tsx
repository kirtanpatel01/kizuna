import ProfileCard from "./profile-card"
import ProfileDetails from "./profile-details"
import ProfileConnections from "./profile-connections"

type Props = {
  displayName: string
  username: string
  image?: string | null
}

export function UserInfo({ displayName, username, image }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileCard displayName={displayName} username={username} image={image} />

      <ProfileDetails />

      <ProfileConnections />
    </div>
  )
}

export default UserInfo
