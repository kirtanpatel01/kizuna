import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { postedEchoes, savedEchoes } from "@/lib/echo-data"

export function UserFeed() {
  const [echoView, setEchoView] = useState<"posted" | "saved">("posted")

  const postedQuery = useQuery({
    queryKey: ["echoes", "posted"],
    queryFn: async () => postedEchoes,
    initialData: postedEchoes,
  })

  const savedQuery = useQuery({
    queryKey: ["echoes", "saved"],
    queryFn: async () => savedEchoes,
    initialData: savedEchoes,
  })

  const postedList = postedQuery.data ?? []
  const savedList = savedQuery.data ?? []

  return (
    <Card className="min-h-160">
      <CardHeader className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Echo Panel</CardTitle>
          <CardDescription>Posted echoes and saved echoes in separate tabs.</CardDescription>
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
          {(echoView === "posted" ? postedList : savedList).map((echo) => (
            <Link key={echo.id} to="/echo/$echoId" params={{ echoId: echo.id }}>
              <Card size="sm" className="h-full ring-transparent hover:ring-border/70 bg-background/80 hover:bg-background hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{echo.authorName}</span>
                    <span>{echo.createdAtLabel}</span>
                  </div>

                  <p className="text-xs leading-5 text-foreground/90 line-clamp-5">{echo.content}</p>

                  <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowUpRightIcon className="size-3" />
                    <span>Open echo</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default UserFeed
