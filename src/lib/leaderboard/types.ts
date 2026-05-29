export type LeaderboardScope = "alltime" | "weekly"

export type LeaderboardUserEntry = {
	id: string
	rank: number
	score: number
	name: string
	username: string
	image: string | null
}

export type LeaderboardPostEntry = {
	id: string
	rank: number
	score: number
	content: string
	authorId: string
	authorName: string
	authorUsername: string
	authorImage: string | null
	likeCount: number
	commentCount: number
	saveCount: number
	createdAt: string
}