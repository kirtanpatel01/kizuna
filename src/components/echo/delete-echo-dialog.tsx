import { useState } from "react"

import { deleteEcho } from "@/actions/feed.write.actions"
import { type FeedEcho } from "@/actions/feed.utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

type DeleteEchoDialogProps = {
  echo: FeedEcho
  onDeleted: (echoId: string) => void
}

export function DeleteEchoDialog({ echo, onDeleted }: DeleteEchoDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      await deleteEcho({ data: { echoId: echo.id } })

      onDeleted(echo.id)
      setOpen(false)
      toast.success("Echo deleted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete echo"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete echo"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Echo</DialogTitle>
            <DialogDescription>
              This will permanently remove the echo from your feed.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            {echo.content}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>

            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete echo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DeleteEchoDialog