import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  ArrowUpRightIcon,
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Send,
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
import { getMyPostedEchoes, type FeedEcho } from "@/actions/feed.actions"
import { Button } from "@/components/ui/button"

export function UserFeed() {
  const [echoView, setEchoView] = useState<"posted" | "saved">("posted")

  const queryClient = useQueryClient()

  const postedQuery = useQuery({
    queryKey: ["echoes", "posted"],
    queryFn: async () => getMyPostedEchoes(),
  })

  const postedList = postedQuery.data ?? []

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
          {echoView === "posted" && postedQuery.isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <Card
                  key={`skeleton-${idx}`}
                  size="sm"
                  className="h-full animate-pulse bg-background/80 ring-transparent hover:bg-background hover:shadow-lg hover:ring-border/70"
                >
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                      <div className="h-3 w-6 rounded bg-muted/30" />

                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="h-5 w-5 rounded bg-muted/30" />
                        <div className="h-5 w-5 rounded bg-muted/30" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-full rounded bg-muted/30" />
                      <div className="h-3 w-11/12 rounded bg-muted/30" />
                      <div className="h-3 w-4/5 rounded bg-muted/30" />
                      <div className="h-3 w-2/3 rounded bg-muted/30" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="h-3 w-8 rounded bg-muted/30" />
                      <div className="h-3 w-8 rounded bg-muted/30" />
                      <div className="h-3 w-8 rounded bg-muted/30" />
                      <div className="h-3 w-8 rounded bg-muted/30" />
                    </div>

                    <div className="h-6 w-6 rounded bg-muted/30" />
                  </CardFooter>
                </Card>
              ))
            : (echoView === "posted" ? postedList : []).map((echo) => (
                <Card
                  key={echo.id}
                  size="sm"
                  className="bg-white dark:bg-black hover:ring-primary/15"
                >
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                      <div>{echo.createdAtLabel}</div>

                      {echoView === "posted" ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <EditEchoDialog
                            echo={echo}
                            onUpdated={(updated) => {
                              queryClient.setQueryData<FeedEcho[]>(
                                ["echoes", "posted"],
                                (current) =>
                                  (current ?? []).map((item) =>
                                    item.id === updated.id ? updated : item
                                  )
                              )
                            }}
                          />

                          <DeleteEchoDialog
                            echo={echo}
                            onDeleted={(echoId) => {
                              queryClient.setQueryData<FeedEcho[]>(
                                ["echoes", "posted"],
                                (current) =>
                                  (current ?? []).filter(
                                    (item) => item.id !== echoId
                                  )
                              )
                            }}
                          />
                        </div>
                      ) : null}
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
                        icon={Send}
                        value={echo.shareCount}
                        colorClassName="text-yellow-400"
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

          {echoView === "saved" ? (
            <div className="col-span-full rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              Saved echoes are not connected yet.
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
