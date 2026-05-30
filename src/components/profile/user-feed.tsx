import { useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowUpRightIcon,
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditEchoDialog } from "@/components/echo/edit-echo-dialog"
import { DeleteEchoDialog } from "@/components/echo/delete-echo-dialog"
import { type FeedEcho } from "@/actions/feed.utils"
import { Button } from "@/components/ui/button"

type Props = {
  postedEchoes: FeedEcho[]
  savedEchoes: FeedEcho[]
  onPostedEchoUpdated: (echo: FeedEcho) => void
  onPostedEchoDeleted: (echoId: string) => void
}

export function UserFeed({
  postedEchoes,
  savedEchoes,
  onPostedEchoUpdated,
  onPostedEchoDeleted,
}: Props) {
  const [echoView, setEchoView] = useState<"posted" | "saved">("posted")

  return (
    <Card className="bg-transperant min-h-160">
      <CardHeader className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Echo Panel</CardTitle>
          <CardDescription>
            Posted echoes and saved echoes in separate tabs.
          </CardDescription>
        </div>

        <Tabs value={echoView} onValueChange={(v) => setEchoView(v as any)}>
          <TabsList>
            <TabsTrigger value="posted">Posted</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {(echoView === "posted" ? postedEchoes : savedEchoes).map((echo) => (
                <Card
                  key={echo.id}
                  size="sm"
                  className="bg-white dark:bg-black hover:ring-primary/15"
                >
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                      {echoView === "posted" ? (
                        <div>{echo.createdAtLabel}</div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-2">
                          {echo.authorImage ? (
                            <img
                              src={echo.authorImage}
                              alt={`${echo.authorName} profile`}
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold uppercase text-muted-foreground">
                              {echo.authorName?.slice(0, 1) ?? "U"}
                            </div>
                          )}

                          <div className="min-w-0 leading-tight">
                            <div className="truncate text-sm font-medium text-foreground">
                              {echo.authorName}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              @{echo.authorUsername}
                            </div>
                          </div>
                        </div>
                      )}

                      {echoView === "posted" ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <EditEchoDialog
                            echo={echo}
                            onUpdated={(updated) => {
                              onPostedEchoUpdated(updated)
                            }}
                          />

                          <DeleteEchoDialog
                            echo={echo}
                            onDeleted={(echoId) => {
                              onPostedEchoDeleted(echoId)
                            }}
                          />
                        </div>
                      ) : (
                        <div>{echo.createdAtLabel}</div>
                      )}
                    </div>

                    {echo.content}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Metric
                        icon={HeartIcon}
                        value={echo.likeCount}
                        colorClassName="text-rose-400"
                      />
                      <Metric
                        icon={MessageCircleIcon}
                        value={echo.commentCount}
                        colorClassName="text-green-400"
                      />
                      <Metric
                        icon={BookmarkIcon}
                        value={echo.saveCount}
                        colorClassName="text-sky-400"
                      />
                    </div>

                    <Link to="/echo/$echoId" params={{ echoId: echo.id }}>
                      <Button variant="secondary" size="icon-xs">
                        <ArrowUpRightIcon />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}

          {echoView === "saved" && savedEchoes.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              No saved echoes yet.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  value,
  colorClassName,
}: {
  icon: typeof HeartIcon
  value: number
  colorClassName: string
}) {
  return (
    <div className={`flex items-center gap-0.5 ${colorClassName}`}>
      <Icon size={14} />
      <span>{value}</span>
    </div>
  )
}

export default UserFeed
