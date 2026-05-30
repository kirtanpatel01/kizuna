import { useEffect, useRef, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { getCurrentUser } from "@/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  type AccountUser,
  useAccountMutations,
} from "@/hooks/use-account-mutations"
import { toast } from "sonner"
import { Link } from "@tanstack/react-router"
import { ModeToggle } from "@/components/mode-toggle"

export const Route = createFileRoute("/(authed)/account")({
  loader: async () => getCurrentUser(),
  head: () => ({
    meta: [
      {
        title: "Account | Greem",
      },
      {
        name: "description",
        content: "Manage your Greem account details, email, and avatar.",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const initialUser = Route.useLoaderData()
  const navigate = useNavigate()
  const [user, setUser] = useState<AccountUser | null>(initialUser)
  const [editing, setEditing] = useState(false)
  const [formName, setFormName] = useState(initialUser?.name ?? "")
  const [formUsername, setFormUsername] = useState(initialUser?.username ?? "")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUser(initialUser)
    setFormName(initialUser?.name ?? "")
    setFormUsername(initialUser?.username ?? "")
    setEditing(false)
    setSelectedImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }, [initialUser])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const { saveMutation, logoutMutation } = useAccountMutations({
    onSaveSuccess: (updatedUser) => {
      setUser(updatedUser)
      setEditing(false)
      setSelectedImage(null)
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      setImagePreview(null)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
      toast.success("Account updated")
    },
    onLogoutSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (message) => {
      toast.error(message)
    },
  })

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-6">You are not signed in.</CardContent>
        </Card>
      </div>
    )
  }

  const isBusy = saveMutation.isPending || logoutMutation.isPending
  const isSaving = saveMutation.isPending

  const startEditing = () => {
    setFormName(user.name ?? "")
    setFormUsername(user.username ?? "")
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setSelectedImage(null)
    setFormName(user.name ?? "")
    setFormUsername(user.username ?? "")
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  return (
    <div className="mx-auto max-w-2xl p-2 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-muted-foreground">
                Manage your account information
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <Button
                  variant="secondary"
                  onClick={startEditing}
                  disabled={isBusy}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={isBusy}
              >
                {logoutMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  "Log out"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Full name</div>
              <div className="mt-1">
                {editing ? (
                  <Input
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                  />
                ) : (
                  <div className="font-medium">{user.name ?? "—"}</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Username</div>
              <div className="mt-1">
                {editing ? (
                  <Input
                    value={formUsername}
                    onChange={(event) => setFormUsername(event.target.value)}
                  />
                ) : (
                  <div className="font-medium">{user.username ?? "—"}</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="mt-1 font-medium">{user.email ?? "—"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                Email verified
              </div>
              <div className="mt-1 font-medium">
                {user.emailVerified ? "Yes" : "No"}
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-sm text-muted-foreground">Avatar</div>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="selected avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : user.image ? (
                    <img
                      src={user.image}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">—</div>
                  )}
                </div>

                {editing ? (
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        Choose photo
                      </Button>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP. The selected image is uploaded when you
                      save.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
        {editing && (
          <CardFooter className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              onClick={cancelEditing}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!user) return

                saveMutation.mutate({
                  user,
                  name: formName,
                  username: formUsername,
                  selectedImage,
                })
              }}
              disabled={isSaving}
            >
              {isSaving ? <Spinner className="size-4" /> : "Save"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="flex w-full justify-center">
        <Link to="/">
          <Button className="mt-8">Go to Home</Button>
        </Link>
        <ModeToggle />
      </div>
    </div>
  )
}
