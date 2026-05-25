import { useState } from "react"

import { updateEcho, type FeedEcho } from "@/actions/feed.actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

const MAX_ECHO_LENGTH = 280

type EditEchoDialogProps = {
  echo: FeedEcho
  onUpdated: (echo: FeedEcho) => void
}

export function EditEchoDialog({ echo, onUpdated }: EditEchoDialogProps) {
  const [open, setOpen] = useState(false)
  const [draftContent, setDraftContent] = useState(echo.content)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (isSaving) return

    const trimmed = draftContent.trim()
    if (!trimmed) {
      toast.error("Echo content is required")
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateEcho({
        data: { echoId: echo.id, content: trimmed },
      })

      onUpdated(updated)
      setOpen(false)
      toast.success("Echo updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update echo"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Edit echo"
        onClick={() => {
          setDraftContent(echo.content)
          setOpen(true)
        }}
      >
        <PencilIcon />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setDraftContent(echo.content)
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Echo</DialogTitle>
            <DialogDescription>Update the content of your echo and save the changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value.slice(0, MAX_ECHO_LENGTH))}
              className="min-h-36"
              placeholder="Edit your echo"
            />

            <div className="text-right text-muted-foreground">
              {draftContent.length}/{MAX_ECHO_LENGTH}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={!draftContent.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EditEchoDialog