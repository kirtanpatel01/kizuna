import { useQuery } from "@tanstack/react-query"
import { getProfile, getPublicProfile } from "@/actions/profile.action"

type ConnectionUser = {
  id: string
  name: string
  username: string | null
  image?: string | null
}

export type ProfileData = {
  dob: string | null
  gender: "male" | "female" | "no" | null
  bio: string | null
} | null

export type PublicProfileData = {
  id: string
  name: string
  username: string | null
  image: string | null
  bio: string | null
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
  followers: ConnectionUser[]
  following: ConnectionUser[]
}

type ProfileHookResult<T> = {
  data: T
  isLoading: boolean
  isPending: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export function useProfile(): ProfileHookResult<ProfileData>
export function useProfile(username: string): ProfileHookResult<PublicProfileData | null>
export function useProfile(username?: string) {
  const resolvedUsername = username?.trim() ?? ""
  const isPublicProfile = resolvedUsername.length > 0

  const queryKey = isPublicProfile
    ? (["public-profile", resolvedUsername] as const)
    : (["profile"] as const)

  const queryFn = async (): Promise<ProfileData | PublicProfileData> => {
    if (isPublicProfile) {
      return getPublicProfile({ data: { username: resolvedUsername } })
    }

    return getProfile()
  }

  const profileQuery = useQuery<ProfileData | PublicProfileData | null, Error, ProfileData | PublicProfileData | null>({
    queryKey,
    queryFn,
    enabled: isPublicProfile ? Boolean(resolvedUsername) : true,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: profileQuery.data ?? null,
    isLoading: profileQuery.isPending,
    isPending: profileQuery.isPending,
    error: profileQuery.error instanceof Error ? profileQuery.error : null,
    refetch: profileQuery.refetch,
  } as ProfileHookResult<ProfileData | PublicProfileData | null>
}
