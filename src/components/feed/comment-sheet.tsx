import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send } from "lucide-react"
import { useState } from "react"

import { type EchoCommentNode } from "@/actions/comment.actions"
import CommentCard from "@/components/feed/comment-card"
import { useComments } from "@/hooks/use-comments"

function CommentSheet({
  echoId,
  commentCount = 0,
}: {
  echoId: string
  commentCount?: number
}) {
  const {
    comments,
    commentCount: threadCommentCount,
    isLoading,
    isSubmitting,
    pendingLikeIds,
    createComment,
    editComment,
    deleteComment,
    toggleCommentLike,
  } = useComments({ echoId, initialCommentCount: commentCount })
  const [replyTarget, setReplyTarget] = useState<EchoCommentNode | null>(null)
  const [draft, setDraft] = useState("")

  const submitComment = async () => {
    const content = draft.trim()

    if (!content) {
      return
    }

    await createComment({
      content,
      parentId: replyTarget?.id ?? null,
    })

    setDraft("")
    setReplyTarget(null)
  }

  return (
    <Sheet>
      <SheetTrigger className="flex cursor-pointer items-center gap-1 text-slate-500 transition-colors hover:text-primary">
        <MessageCircle size={16} />
        <span>{threadCommentCount}</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>

        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {isLoading ? (
              <div className="space-y-3 py-4 text-sm text-muted-foreground">
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onReply={setReplyTarget}
                    onToggleLike={toggleCommentLike}
                    onEditComment={(commentId, content) =>
                      editComment({ commentId, content })
                    }
                    onDeleteComment={(commentId) => deleteComment(commentId)}
                    pendingLikeIds={pendingLikeIds}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                No comments yet. Start the thread.
              </div>
            )}
          </div>

          <Separator />

          <SheetFooter className="space-y-3">
            {replyTarget ? (
              <div className="flex items-center justify-between gap-3 border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                <div className="min-w-0 text-muted-foreground">
                  Replying to{" "}
                  <span className="font-medium text-foreground">
                    @{replyTarget.authorUsername}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground"
                  onClick={() => setReplyTarget(null)}
                >
                  Clear
                </Button>
              </div>
            ) : null}

            <div className="flex flex-col">
              <Textarea
                placeholder={
                  replyTarget
                    ? `Reply to @${replyTarget.authorUsername}...`
                    : "Write a reply with @mentions, thoughts, or context..."
                }
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-24 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
              />

              <Button
                type="button"
                className="self-end"
                onClick={submitComment}
                disabled={isSubmitting || draft.trim().length === 0}
              >
                <Send className="size-4" />
                {replyTarget ? "Post reply" : "Post comment"}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CommentSheet
