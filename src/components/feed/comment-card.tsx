import { useEffect, useState } from "react"
import {
  MoreVertical,
  PencilLine,
  Reply,
  Trash2,
  Heart,
  UserCircle2,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type EchoCommentNode } from "@/actions/comment.actions"
import { Link } from "@tanstack/react-router"

type CommentCardProps = {
  comment: EchoCommentNode
  level?: number
  parentAuthorUsername?: string
  onReply: (comment: EchoCommentNode) => void
  onToggleLike: (commentId: string) => void
  onEditComment: (commentId: string, content: string) => Promise<unknown>
  onDeleteComment: (commentId: string) => Promise<unknown>
  pendingLikeIds: Set<string>
}

function CommentCard({
  comment,
  level = 0,
  parentAuthorUsername,
  onReply,
  onToggleLike,
  onEditComment,
  onDeleteComment,
  pendingLikeIds,
}: CommentCardProps) {
  const { data: session } = authClient.useSession()
  const [showReplies, setShowReplies] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const replies = comment.replies ?? []
  const hasReplies = replies.length > 0
  const isOwner = session?.user?.id === comment.authorId

  useEffect(() => {
    if (!isEditing) {
      setDraft(comment.content)
    }
  }, [comment.content, isEditing])

  const saveEdit = async () => {
    const content = draft.trim()
    if (!content) {
      return
    }

    setIsSaving(true)
    try {
      await onEditComment(comment.id, content)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    await onDeleteComment(comment.id)
  }

  return (
    <div>
      <div>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {comment.authorImage ? (
                  <img
                    src={comment.authorImage}
                    alt={comment.authorName}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="size-10 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="truncate font-medium text-foreground">
                    {comment.authorName}
                    {comment.isEchoAuthor ? (
                      <span className="ml-2 text-xs text-primary">Author</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    @{comment.authorUsername}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{comment.createdAtLabel}</span>
                {isOwner ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <PencilLine className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-24 resize-y border-border/70"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    onClick={saveEdit}
                    disabled={isSaving || draft.trim().length === 0}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 ml-4 border-l border-border/70 pl-4 text-sm leading-6 whitespace-pre-wrap text-foreground/90">
                {level > 0 && parentAuthorUsername ? (
                  <span className="mr-1 text-muted-foreground select-none">
                    {/* Replying to{" "} */}
                    <Link
                      to="/$username"
                      params={{ username: parentAuthorUsername }}
                      className="text-primary font-medium hover:underline cursor-pointer"
                    >
                      @{parentAuthorUsername}
                    </Link>{" "}
                  </span>
                ) : null}
                {comment.content}
              </p>
            )}

            <div className="mt-1 ml-4 flex items-center justify-between gap-2">
              <div>
                {hasReplies ? (
                  <button
                    type="button"
                    className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => setShowReplies((current) => !current)}
                  >
                    {showReplies
                      ? "Hide replies"
                      : `Show replies (${replies.length})`}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-muted-foreground  hover:text-rose-500 ${
                    comment.isLiked ? "text-rose-500" : ""
                  }`}
                  onClick={() => onToggleLike(comment.id)}
                  disabled={pendingLikeIds.has(comment.id)}
                >
                  <Heart
                    size={16}
                    className={comment.isLiked ? "fill-current" : ""}
                  />
                  <span>{comment.likeCount}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground  hover:text-primary"
                  onClick={() => onReply(comment)}
                >
                  <Reply size={16} />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasReplies && showReplies ? (
        <div className={`mt-6 ${level === 0 ? "ml-6" : "ml-0"} space-y-3`}>
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              level={level + 1}
              parentAuthorUsername={comment.authorUsername}
              onReply={onReply}
              onToggleLike={onToggleLike}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              pendingLikeIds={pendingLikeIds}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default CommentCard
