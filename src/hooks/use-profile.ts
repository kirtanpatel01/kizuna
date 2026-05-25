import { useQuery } from "@tanstack/react-query"
import { getProfile } from "@/actions/profile.action"

export type ProfileData = {
  dob: string | null
  gender: "male" | "female" | "no" | null
  bio: string | null
} | null

export function useProfile() {
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: profileQuery.data ?? null,
    isLoading: profileQuery.isPending,
    error: profileQuery.error instanceof Error ? profileQuery.error : null,
    refetch: profileQuery.refetch,
  }
}
