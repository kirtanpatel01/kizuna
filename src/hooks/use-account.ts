import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  getImageKitAuth,
  logoutUser,
  updateProfile,
} from '@/actions/auth.actions'
import { toast } from 'sonner'
type AccountUser = {
  id: string
  name?: string | null
  username?: string | null
  email?: string | null
  emailVerified?: boolean | null
  image?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export function useAccount() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: ['account'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5,
  })

  const user = profileQuery.data ?? null
  const loading = profileQuery.isPending
  const [loggingOut, setLoggingOut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  useEffect(() => {
    if (!editing && user) {
      setFormName(user.name ?? '')
      setFormUsername(user.username ?? '')
    }
  }, [editing, user])

  const saveProfileMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      username: string
      image?: string
    }) => {
      const result = await updateProfile({ data: payload })
      if (!result?.success) {
        throw new Error(result?.message ?? 'Failed to update account')
      }

      return payload
    },
    onSuccess: (payload) => {
      queryClient.setQueryData<AccountUser | null>(['account'], (current) =>
        current ? { ...current, ...payload } : current,
      )
    },
  })

  async function handleLogout() {
    setLoggingOut(true)
    try {
      const result = await logoutUser()
      if (result?.success) {
        navigate({ to: '/login' })
      }
    } finally {
      setLoggingOut(false)
    }
  }

  function startEditing() {
    setFormName(user?.name ?? '')
    setFormUsername(user?.username ?? '')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setSelectedImage(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await saveProfileMutation.mutateAsync({
        name: formName,
        username: formUsername,
      })
      setEditing(false)
      toast.success('Account updated')
    } catch (error) {
      console.error('save error', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update account')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleImageUpload() {
    if (!selectedImage) {
      toast.error('Choose an image first')
      return
    }

    if (!user) {
      toast.error('Account not loaded yet')
      return
    }

    setUploadingImage(true)
    try {
      const auth = await getImageKitAuth()
      if (!auth?.success) {
        toast.error(auth?.message ?? 'Unable to start upload')
        return
      }

      const { upload } = await import('@imagekit/react')
      const response = await upload({
        file: selectedImage,
        fileName: selectedImage.name,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: auth.publicKey,
      })

      const imageUrl = response.url
      await saveProfileMutation.mutateAsync({
        name: formName || user.name || '',
        username: formUsername || user.username || '',
        image: imageUrl,
      })

      queryClient.setQueryData<AccountUser | null>(['account'], (current) =>
        current ? { ...current, image: imageUrl } : current,
      )
      setSelectedImage(null)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
      toast.success('Account picture updated')
    } catch (error) {
      console.error('image upload error', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  return {
    user,
    loading,
    loggingOut,
    editing,
    formName,
    formUsername,
    saving: isSaving || saveProfileMutation.isPending,
    selectedImage,
    imagePreview,
    uploadingImage,
    imageInputRef,
    setSelectedImage,
    setImagePreview,
    setFormName,
    setFormUsername,
    setEditing,
    handleLogout,
    startEditing,
    cancelEditing,
    handleSave,
    handleImageUpload,
  }
}
