import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { getLeaderboardData, type LeaderboardData } from "@/actions/leaderboard.actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const Route = createFileRoute("/leaderboard")({
	loader: async () => getLeaderboardData(),
	component: LeaderboardRoute,
})

type ScopeKey = "alltime" | "weekly"

function LeaderboardRoute() {
	const data = Route.useLoaderData() as LeaderboardData
	const [scope, setScope] = useState<ScopeKey>("alltime")

	return (
		<div className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
			<div className="w-full max-w-5xl space-y-5">
				<Tabs value={scope} onValueChange={(value) => setScope(value as ScopeKey)}>
					<TabsList>
						<TabsTrigger value="alltime">All time</TabsTrigger>
						<TabsTrigger value="weekly">Weekly</TabsTrigger>
					</TabsList>

					<TabsContent value="alltime">
						<div className="grid gap-4 lg:grid-cols-2">
							<SimpleBoard
								title="Users"
								entries={data.alltime.users}
								emptyLabel="no users"
								renderEntry={(entry) => (
									<>
										<span className="text-center text-sm text-muted-foreground">{entry.rank}</span>
										<Link to="/$username" params={{ username: entry.username }} className="contents">
											<UserAvatar image={entry.image} name={entry.name} />
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm">{entry.name}</div>
												<div className="truncate text-xs text-muted-foreground">@{entry.username}</div>
											</div>
										</Link>
										<span className="shrink-0 text-sm text-muted-foreground">{entry.score.toFixed(2)}</span>
									</>
								)}
							/>

							<SimpleBoard
								title="Posts"
								entries={data.alltime.posts}
								emptyLabel="no posts"
								renderEntry={(entry) => (
									<>
										<span className="text-center text-sm text-muted-foreground">{entry.rank}</span>
										<Link to="/echo/$echoId" params={{ echoId: entry.id }} className="contents">
											<UserAvatar image={entry.authorImage} name={entry.authorName} />
											<div className="min-w-0 flex-1">
												<div className="truncate text-xs text-muted-foreground">@{entry.authorUsername}</div>
												<div className="mt-1 truncate text-sm">{entry.content}</div>
											</div>
										</Link>
										<span className="shrink-0 text-sm text-muted-foreground">{entry.score.toFixed(0)}</span>
									</>
								)}
							/>
						</div>
					</TabsContent>

					<TabsContent value="weekly">
						<div className="grid gap-4 lg:grid-cols-2">
							<SimpleBoard
								title="Users"
								entries={data.weekly.users}
								emptyLabel="no users"
								renderEntry={(entry) => (
									<>
										<span className="text-center text-sm text-muted-foreground">{entry.rank}</span>
										<Link to="/$username" params={{ username: entry.username }} className="contents">
											<UserAvatar image={entry.image} name={entry.name} />
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm">{entry.name}</div>
												<div className="truncate text-xs text-muted-foreground">@{entry.username}</div>
											</div>
										</Link>
										<span className="shrink-0 text-sm text-muted-foreground">{entry.score.toFixed(2)}</span>
									</>
								)}
							/>

							<SimpleBoard
								title="Posts"
								entries={data.weekly.posts}
								emptyLabel="no posts"
								renderEntry={(entry) => (
									<>
										<span className="text-center text-sm text-muted-foreground">{entry.rank}</span>
										<Link to="/echo/$echoId" params={{ echoId: entry.id }} className="contents">
											<UserAvatar image={entry.authorImage} name={entry.authorName} />
											<div className="min-w-0 flex-1">
												<div className="truncate text-xs text-muted-foreground">@{entry.authorUsername}</div>
												<div className="mt-1 truncate text-sm">{entry.content}</div>
											</div>
										</Link>
										<span className="shrink-0 text-sm text-muted-foreground">{entry.score.toFixed(0)}</span>
									</>
								)}
							/>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

function SimpleBoard<T extends { id: string; rank: number; score: number }>({
	title,
	entries,
	emptyLabel,
	renderEntry,
}: {
	title: string
	entries: T[]
	emptyLabel: string
	renderEntry: (entry: T) => React.ReactNode
}) {
	return (
		<div className="border border-border/70">
			<div className="p-2 text-sm text-muted-foreground">{title}</div>
			{entries.length > 0 ? (
				<div className="divide-y divide-border/60 border-t border-border/70">
					{entries.map((entry) => (
						<div key={entry.id} className="grid grid-cols-[2rem_2rem_minmax(0,1fr)_auto] items-center gap-3 p-3">
							{renderEntry(entry)}
						</div>
					))}
				</div>
			) : (
				<div className="border-t border-border/70 py-4 text-sm text-muted-foreground">
					{emptyLabel}
				</div>
			)}
		</div>
	)
}

function UserAvatar({
	image,
	name,
}: {
	image: string | null | undefined
	name: string
}) {
	const initials =
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "?"

	return (
		<div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-medium text-foreground">
			{image ? (
				<img src={image} alt={name} className="size-full object-cover" />
			) : (
				<span>{initials}</span>
			)}
		</div>
	)
}