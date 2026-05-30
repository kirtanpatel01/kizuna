import { upload } from "@imagekit/react"
import { useMutation } from "@tanstack/react-query"

import {
  getImageKitAuth,
  logoutUser,
  updateProfile,
} from "@/actions/auth.actions"

export type AccountUser = {
  id: string
  name?: string | null
  username?: string | null
  email?: string | null
  emailVerified?: boolean | null
  image?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type SaveAccountInput = {
  user: AccountUser
  name: string
  username: string
  selectedImage: File | null
}

type UseAccountMutationsArgs = {
  onSaveSuccess: (user: AccountUser) => void
  onLogoutSuccess: () => void
  onError: (message: string) => void
}

export function useAccountMutations({
  onSaveSuccess,
  onLogoutSuccess,
  onError,
}: UseAccountMutationsArgs) {
  const saveMutation = useMutation({
    mutationFn: async ({
      user,
      name,
      username,
      selectedImage,
    }: SaveAccountInput) => {
      let imageUrl = user.image ?? undefined

      if (selectedImage) {
        const auth = await getImageKitAuth()
        if (!auth?.success) {
          throw new Error(auth?.message ?? "Unable to start upload")
        }

        const response = await upload({
          file: selectedImage,
          fileName: selectedImage.name,
          token: auth.token,
          expire: auth.expire,
          signature: auth.signature,
          publicKey: auth.publicKey,
        })

        imageUrl = response.url
      }

      const result = await updateProfile({
        data: {
          name,
          username,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      })

      if (!result?.success) {
        throw new Error(result?.message ?? "Failed to update account")
      }

      return {
        ...user,
        name,
        username,
        image: imageUrl ?? user.image,
      }
    },
    onSuccess: (updatedUser) => {
      onSaveSuccess(updatedUser)
    },
    onError: (error) => {
      onError(
        error instanceof Error ? error.message : "Failed to update account",
      )
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await logoutUser()
      if (!result?.success) {
        throw new Error(result?.message ?? "Failed to log out")
      }
    },
    onSuccess: () => {
      onLogoutSuccess()
    },
    onError: (error) => {
      onError(error instanceof Error ? error.message : "Failed to log out")
    },
  })

  return {
    saveMutation,
    logoutMutation,
  }
}