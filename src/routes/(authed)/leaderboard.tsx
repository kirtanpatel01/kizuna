import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"

import { getLeaderboardData, type LeaderboardData } from "@/actions/leaderboard.actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

export const Route = createFileRoute("/(authed)/leaderboard")({
	loader: async () => getLeaderboardData(),
	component: LeaderboardRoute,
})

type ScopeKey = "alltime" | "weekly"

function LeaderboardRoute() {
	const initial = Route.useLoaderData() as LeaderboardData
 	const [data, setData] = useState<LeaderboardData>(initial)
 	const [scope, setScope] = useState<ScopeKey>("alltime")

	// open SSE connection to receive realtime leaderboard updates
	useEffect(() => {
		const es = new EventSource('/api/leaderboard/subscribe')
		es.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data)
				if (!msg || !msg.event) return
				setData((prev) => {
					const next = { ...prev }
					// handle post score updates
					if (msg.event === 'postScoreUpdated') {
						const { postId, nextAllTimeScore, nextWeeklyScore } = msg as any
						if (typeof nextAllTimeScore === 'number') {
							next.alltime.posts = next.alltime.posts.map((p) => p.id === postId ? { ...p, score: nextAllTimeScore } : p)
							// re-sort and limit
							next.alltime.posts.sort((a,b) => b.score - a.score)
							for (let i=0;i<next.alltime.posts.length;i++) next.alltime.posts[i].rank = i+1
						}
						if (typeof nextWeeklyScore === 'number') {
							next.weekly.posts = next.weekly.posts.map((p) => p.id === postId ? { ...p, score: nextWeeklyScore } : p)
							next.weekly.posts.sort((a,b) => b.score - a.score)
							for (let i=0;i<next.weekly.posts.length;i++) next.weekly.posts[i].rank = i+1
						}
					}

					// handle new post
					if (msg.event === 'postCreated') {
						// on create we simply prepend a placeholder entry with 0 score; optional: fetch full snapshot
						const { postId, authorId } = msg as any
						// avoid duplicates
						if (!next.alltime.posts.find(p => p.id === postId)) {
							next.alltime.posts.unshift({ id: postId, rank: 0, score: 0, content: '', authorId, authorName: 'Unknown', authorUsername: 'unknown', authorImage: null, likeCount:0, commentCount:0, saveCount:0, createdAt: '' })
							next.alltime.posts.sort((a,b) => b.score - a.score)
							for (let i=0;i<next.alltime.posts.length;i++) next.alltime.posts[i].rank = i+1
						}
					}

					if (msg.event === 'postDeleted') {
						const { postId } = msg as any
						next.alltime.posts = next.alltime.posts.filter(p => p.id !== postId)
						next.weekly.posts = next.weekly.posts.filter(p => p.id !== postId)
						for (let i=0;i<next.alltime.posts.length;i++) next.alltime.posts[i].rank = i+1
						for (let i=0;i<next.weekly.posts.length;i++) next.weekly.posts[i].rank = i+1
					}

					if (msg.event === 'userScoreUpdated') {
						const { userId, normalizedScore } = msg as any
						next.alltime.users = next.alltime.users.map(u => u.id === userId ? { ...u, score: normalizedScore } : u)
						next.alltime.users.sort((a,b) => b.score - a.score)
						for (let i=0;i<next.alltime.users.length;i++) next.alltime.users[i].rank = i+1
					}

					return next
				})
			} catch (err) {
				console.warn('failed to parse SSE message', err)
			}
		}
		es.onerror = () => {
			es.close()
		}
		return () => es.close()
	}, [])

	return (
		<div className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
			<div className="w-full max-w-7xl space-y-5">
				<Tabs value={scope} onValueChange={(value) => setScope(value as ScopeKey)}>
					<TabsList>
						<TabsTrigger value="alltime">All time</TabsTrigger>
						<TabsTrigger value="weekly">Weekly</TabsTrigger>
					</TabsList>

					<TabsContent value="alltime">
						<div className="grid gap-4 xl:grid-cols-[0.45fr_1.15fr]">
							<SimpleBoard
								title="Users"
									entries={data.alltime.users}
								emptyLabel="no users"
								renderEntry={(entry) => (
									<Link to="/$username" params={{ username: entry.username }} className="flex items-center gap-3">
										<UserAvatar image={entry.image} name={entry.name} />
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm">{entry.name}</div>
											<div className="truncate text-xs text-muted-foreground">@{entry.username}</div>
										</div>
									</Link>
								)}
							/>

							<SimpleBoard
								title="Posts"
								entries={data.alltime.posts}
								emptyLabel="no posts"
								scoreFormatter={(s) => s.toFixed(0)}
								renderEntry={(entry) => (
									<Link to="/echo/$echoId" params={{ echoId: entry.id }} className="flex items-center gap-3">
										<UserAvatar image={entry.authorImage} name={entry.authorName} />
										<div className="min-w-0 flex-1">
											<div className="truncate text-xs text-muted-foreground">@{entry.authorUsername}</div>
											<div className="mt-1 truncate text-sm">{entry.content}</div>
										</div>
									</Link>
								)}
							/>
						</div>
					</TabsContent>

					<TabsContent value="weekly">
						<div className="grid gap-4 xl:grid-cols-[0.45fr_1.15fr]">
							<SimpleBoard
								title="Users"
								entries={data.weekly.users}
								emptyLabel="no users"
								renderEntry={(entry) => (
									<Link to="/$username" params={{ username: entry.username }} className="flex items-center gap-3">
										<UserAvatar image={entry.image} name={entry.name} />
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm">{entry.name}</div>
											<div className="truncate text-xs text-muted-foreground">@{entry.username}</div>
										</div>
									</Link>
								)}
							/>

							<SimpleBoard
								title="Posts"
								entries={data.weekly.posts}
								emptyLabel="no posts"
								scoreFormatter={(s) => s.toFixed(0)}
								renderEntry={(entry) => (
									<Link to="/echo/$echoId" params={{ echoId: entry.id }} className="flex items-center gap-3">
										<UserAvatar image={entry.authorImage} name={entry.authorName} />
										<div className="min-w-0 flex-1">
											<div className="truncate text-xs text-muted-foreground">@{entry.authorUsername}</div>
											<div className="mt-1 truncate text-sm">{entry.content}</div>
										</div>
									</Link>
								)}
							/>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

function SimpleBoard<T extends { id: string; rank: number; score: number }>(
	{
		title,
		entries,
		emptyLabel,
		renderEntry,
		scoreFormatter = (s: number) => s.toFixed(2),
		pageSize = 10,
	}: {
		title: string
		entries: T[]
		emptyLabel: string
		renderEntry: (entry: T) => React.ReactNode
		scoreFormatter?: (score: number) => string
		pageSize?: number
	}
) {
	const [page, setPage] = useState(1)
	const pageCount = Math.max(1, Math.ceil(entries.length / pageSize))
	const start = (page - 1) * pageSize
	const paged = entries.slice(start, start + pageSize)

	// reset page when entries change and current page would be out of range
	useEffect(() => {
		if (page > pageCount) setPage(1)
	}, [entries.length, pageCount])

	return (
		<div className="border border-border/70">
			<div className="p-2 text-sm text-muted-foreground">{title}</div>
			{entries.length > 0 ? (
				<>
					<Table className="table-fixed">
						<TableHeader>
							<tr>
								<TableHead className="w-12 text-center">#</TableHead>
								<TableHead>Entry</TableHead>
								<TableHead className="w-24 text-right">Score</TableHead>
							</tr>
						</TableHeader>
						<TableBody>
							{paged.map((entry) => (
								<TableRow key={entry.id}>
									<TableCell className="text-center text-sm text-muted-foreground">{entry.rank}</TableCell>
									<TableCell className="min-w-0 whitespace-normal wrap-break-word">{renderEntry(entry)}</TableCell>
									<TableCell className="text-right text-sm text-muted-foreground">{scoreFormatter(entry.score)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{pageCount > 1 && (
						<Pagination aria-label={`${title} pagination`} className="mt-2">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
								</PaginationItem>

								{Array.from({ length: pageCount }).map((_, i) => (
									<PaginationItem key={i}>
										<PaginationLink isActive={i + 1 === page} onClick={() => setPage(i + 1)}>
											{String(i + 1)}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext onClick={() => setPage((p) => Math.min(pageCount, p + 1))} />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</>
			) : (
				<div className="border-t border-border/70 py-4 text-sm text-muted-foreground">{emptyLabel}</div>
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