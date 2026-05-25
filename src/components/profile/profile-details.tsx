import { useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/use-profile"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"
import { upsertProfile } from "@/actions/profile.action"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "../ui/field"

export function ProfileDetails() {
  const [dob, setDob] = useState<Date | null>(() => null)
  const [gender, setGender] = useState<"male" | "female" | "no" | null>(null)
  const [bio, setBio] = useState<string | null>(() => null)
  const [editingBio, setEditingBio] = useState(false)
  const [draftBio, setDraftBio] = useState<string>(() => bio ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: profileData, isLoading, refetch } = useProfile()

  const profileDob = profileData?.dob ? new Date(profileData.dob) : null
  const profileGender = profileData?.gender ?? null
  const profileBio = profileData?.bio ?? null

  const currentDob = dob ?? profileDob
  const currentGender = gender ?? profileGender
  const currentBio = bio ?? profileBio

  const formattedDob = useMemo(() => {
    if (!currentDob) return "Not provided"
    return currentDob.toLocaleDateString("en-GB")
  }, [currentDob])

  const savedDob = useMemo(() => {
    if (!currentDob) return null
    const year = currentDob.getFullYear()
    const month = String(currentDob.getMonth() + 1).padStart(2, "0")
    const day = String(currentDob.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [currentDob])

  async function handleSave() {
    const bioToSave = editingBio ? draftBio : (currentBio ?? "")

    // Validation: require at least one field provided by the user
    if (!savedDob && !currentGender && (!bioToSave || bioToSave.trim() === "")) {
      setValidationError(
        "Please provide at least one profile value before saving."
      )
      toast.error("Please provide at least one profile value before saving.")
      return
    }

    setValidationError(null)
    setIsSaving(true)
    try {
      const result = await upsertProfile({
        data: {
          dob: savedDob,
          gender: currentGender === "no" ? "no" : currentGender,
          bio: bioToSave || null,
          isPrivate: false,
        },
      })

        if (result.success) {
          setBio(bioToSave || null)
          setEditingBio(false)
          toast.success(result.message ?? "Profile saved")
          try {
            await refetch()
          } catch {}
        } else {
          toast.error(result.message ?? "Failed to save profile")
        }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative space-y-4 bg-secondary/50 shadow p-3">
      <Button variant={"link"} size="xs" onClick={handleSave} disabled={isSaving} className="absolute top-1 right-1">
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <div>
        <label className="text-xs font-medium text-muted-foreground">DOB</label>

        <Popover>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                formattedDob
              )}
            </div>

            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Edit date of birth"
              >
                <PencilIcon className="size-4" />
              </button>
            </PopoverTrigger>
          </div>

          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDob ?? undefined}
              onSelect={(date) => {
                if (date) setDob(date)
              }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Gender
        </label>

        <Popover>
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-medium capitalize">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : currentGender ? (
                currentGender === "no" ? (
                  "Prefer not to say"
                ) : (
                  currentGender
                )
              ) : (
                "Not provided"
              )}
            </div>

            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Edit gender"
              >
                <PencilIcon className="size-4" />
              </button>
            </PopoverTrigger>
          </div>

          <PopoverContent className="w-fit">
            <RadioGroup
              value={currentGender ?? undefined}
              onValueChange={(v) => setGender(v as any)}
            >
              <div className="space-y-2">
                <Field orientation="horizontal">
                  <RadioGroupItem value="male" />
                  <FieldLabel>Male</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="female" />
                  <FieldLabel>Female</FieldLabel>
                </Field>

                <Field orientation="horizontal">
                  <RadioGroupItem value="no" />
                  <FieldLabel>Prefer not to say</FieldLabel>
                </Field>
              </div>
            </RadioGroup>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">Bio</div>

          {!editingBio ? (
            <button
              type="button"
              className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Edit bio"
              onClick={() => {
                setDraftBio(currentBio ?? "")
                setEditingBio(true)
              }}
            >
              <PencilIcon className="size-4" />
            </button>
          ) : null}
        </div>

        {editingBio ? (
          <div className="mt-2">
            <Textarea
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              className="min-h-28"
              autoFocus
              onBlur={() => {
                setBio(draftBio || null)
                setEditingBio(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraftBio(currentBio ?? "")
                  setEditingBio(false)
                }
              }}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoading ? <Skeleton className="h-16 w-full" /> : currentBio ?? "Not provided"}
          </p>
        )}
      </div>

      {validationError ? (
        <div className="text-sm text-red-600">{validationError}</div>
      ) : null}
    </div>
  )
}

export default ProfileDetails
