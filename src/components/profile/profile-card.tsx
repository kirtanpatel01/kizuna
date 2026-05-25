import { CreateEchoDialog } from "@/components/echo/create-echo-dialog"

type Props = {
  displayName: string
  username: string
  image?: string | null
}

export function ProfileCard({ displayName, username, image }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {image ? (
          <img
            src={image}
            alt={displayName}
            className="size-12 rounded-full border object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full border bg-secondary font-medium text-secondary-foreground">
            {displayName
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </div>
        )}

        <div>
          <div className="text-lg font-semibold">{displayName}</div>
          <div className="text-sm text-muted-foreground">@{username}</div>
        </div>
      </div>

      <CreateEchoDialog />
    </div>
  )
}

export default ProfileCard
