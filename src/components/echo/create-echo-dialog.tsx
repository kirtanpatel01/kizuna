import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createEcho } from "@/actions/feed.write.actions"
import { type FeedEcho } from "@/actions/feed.utils"

const MAX_ECHO_LENGTH = 280

function getInitials(name: string) {
  if (!name.trim()) return "U"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join("")
}

type Props = {
  displayName: string
  username: string
  image?: string | null
  onCreated?: (echo: FeedEcho) => void
}

export function CreateEchoDialog({ displayName, username, image, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    if (isCreating) return

    const trimmed = content.trim()
    if (!trimmed) {
      toast.error("Please enter some content")
      return
    }

    setIsCreating(true)
    try {
      const newEcho = await createEcho({ data: { content: trimmed } })

      onCreated?.(newEcho)

      setContent("")
      toast.success("Echo posted")
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post echo"
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Echo</Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Echo</DialogTitle>
          <DialogDescription>Share a short thought with your followers.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {image ? (
              <img src={image} alt={displayName} className="size-10 rounded-full border object-cover" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full border bg-secondary text-sm font-medium text-secondary-foreground">
                {getInitials(displayName)}
              </div>
            )}

            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
          </div>

          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, MAX_ECHO_LENGTH))}
            className="min-h-36"
          />

          <div className="text-right text-xs text-muted-foreground">{content.length}/{MAX_ECHO_LENGTH}</div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isCreating}>Cancel</Button>
          </DialogClose>

          <Button onClick={handleCreate} disabled={!content.trim() || isCreating}>
            {isCreating ? "Posting..." : "Post Echo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
