import { useEffect, useState } from "react"
import {
  MoreHorizontal,
  PencilLine,
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
    <div className="py-2">
      {/* Comment Header and Content Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <Link
            to="/$username"
            params={{ username: comment.authorUsername }}
            className="shrink-0 mt-0.5"
          >
            {comment.authorImage ? (
              <img
                src={comment.authorImage}
                alt={comment.authorName}
                className={`${level > 0 ? "size-8" : "size-10"} rounded-full object-cover`}
              />
            ) : (
              <UserCircle2 className={`${level > 0 ? "size-8" : "size-10"} text-muted-foreground`} />
            )}
          </Link>

          {/* Content & Metadata column */}
          <div className="flex-1 min-w-0 text-sm leading-5">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-20 resize-y border-border/70 text-sm"
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
              <div>
                {/* Username + Content text inline */}
                <p className="text-foreground break-words text-left">
                  <Link
                    to="/$username"
                    params={{ username: comment.authorUsername }}
                    className="font-semibold text-foreground hover:underline mr-1.5"
                  >
                    {comment.authorUsername}
                  </Link>
                  {comment.isEchoAuthor ? (
                    <span className="text-[10px] bg-primary/10 text-primary px-1 rounded mr-1.5 font-medium inline-block align-middle">
                      Author
                    </span>
                  ) : null}
                  {level > 0 && parentAuthorUsername ? (
                    <Link
                      to="/$username"
                      params={{ username: parentAuthorUsername }}
                      className="text-sky-500 font-medium hover:underline mr-1.5"
                    >
                      @{parentAuthorUsername}
                    </Link>
                  ) : null}
                  <span className="text-foreground/90 whitespace-pre-wrap">{comment.content}</span>
                </p>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                  <span>{comment.createdAtLabel}</span>
                  {comment.likeCount > 0 && (
                    <span>
                      {comment.likeCount} {comment.likeCount === 1 ? "like" : "likes"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onReply(comment)}
                    className="font-medium hover:text-foreground cursor-pointer"
                  >
                    Reply
                  </button>

                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="hover:text-foreground cursor-pointer font-bold leading-none"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-32">
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Heart Icon Button on the far right */}
        <button
          type="button"
          className={`shrink-0 self-start p-1.5 text-muted-foreground hover:text-rose-500 transition-colors ${
            comment.isLiked ? "text-rose-500" : ""
          }`}
          onClick={() => onToggleLike(comment.id)}
          disabled={pendingLikeIds.has(comment.id)}
        >
          <Heart
            size={14}
            className={comment.isLiked ? "fill-current" : ""}
          />
        </button>
      </div>

      {/* Nested Replies Section */}
      {hasReplies ? (
        <div style={{ marginLeft: level === 0 ? "3.25rem" : "0" }}>
          {showReplies && (
            <div className="space-y-2 mt-2">
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
          )}

          {/* Toggle replies button with Instagram-like horizontal line separator */}
          <button
            type="button"
            className="flex items-center mt-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
            onClick={() => setShowReplies((current) => !current)}
          >
            <span className="w-6 h-[1px] bg-border mr-2 inline-block"></span>
            <span>
              {showReplies ? "Hide replies" : `View replies (${replies.length})`}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default CommentCard
