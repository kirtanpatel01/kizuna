import { eq, gte, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { echo, user } from "@/lib/schema"
import { redis } from "@/lib/redis"

export const ENGAGEMENT_WEIGHTS = {
	like: 1,
	comment: 3,
	save: 5,
} as const

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

function toNumber(value: string | number | null | undefined) {
	if (value === null || value === undefined || value === "") return 0
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : 0
}

function getDateKey(date: Date) {
	return date.toISOString().slice(0, 10)
}

function getCurrentWeekStartDate(date = new Date()) {
	const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
	const day = utc.getUTCDay()
	const mondayOffset = (day + 6) % 7
	utc.setUTCDate(utc.getUTCDate() - mondayOffset)
	utc.setUTCHours(0, 0, 0, 0)
	return utc
}

export function getCurrentWeekKey(date = new Date()) {
	const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
	const day = utc.getUTCDay()
	const mondayOffset = (day + 6) % 7
	utc.setUTCDate(utc.getUTCDate() - mondayOffset)
	return getDateKey(utc)
}

function getAllTimeUserBoardKey() {
	return "leaderboard:users:alltime"
}

function getAllTimePostBoardKey() {
	return "leaderboard:posts:alltime"
}

function getWeeklyUserBoardKey(weekKey: string) {
	return `leaderboard:users:weekly:${weekKey}`
}

function getWeeklyPostBoardKey(weekKey: string) {
	return `leaderboard:posts:weekly:${weekKey}`
}

function getAllTimeUserStateKey(userId: string) {
	return `leaderboard:state:users:alltime:${userId}`
}

function getAllTimePostStateKey(postId: string) {
	return `leaderboard:state:posts:alltime:${postId}`
}

function getWeeklyPostStateKey(weekKey: string, postId: string) {
	return `leaderboard:state:posts:weekly:${weekKey}:${postId}`
}

function getBoardKeys(scope: LeaderboardScope, weekKey = getCurrentWeekKey()) {
	return scope === "alltime"
		? {
			userBoardKey: getAllTimeUserBoardKey(),
			postBoardKey: getAllTimePostBoardKey(),
		}
		: {
			userBoardKey: getWeeklyUserBoardKey(weekKey),
			postBoardKey: getWeeklyPostBoardKey(weekKey),
		}
}

function getPostScore(row: {
	likeCount: number
	commentCount: number
	saveCount: number
}) {
	return (
		Number(row.likeCount ?? 0) * ENGAGEMENT_WEIGHTS.like +
		Number(row.commentCount ?? 0) * ENGAGEMENT_WEIGHTS.comment +
		Number(row.saveCount ?? 0) * ENGAGEMENT_WEIGHTS.save
	)
}

function getNormalizedUserScore(totalPostScore: number, totalPosts: number) {
	return totalPostScore / Math.sqrt(totalPosts + 1)
}

async function seedAllTimeLeaderboard() {
	const [userCount, postCount] = await Promise.all([
		redis.zcard(getAllTimeUserBoardKey()),
		redis.zcard(getAllTimePostBoardKey()),
	])

	if (userCount > 0 || postCount > 0) {
		return
	}

	const rows = await db
		.select({
			id: echo.id,
			authorId: echo.authorId,
			likeCount: echo.likeCount,
			commentCount: echo.commentCount,
			saveCount: echo.saveCount,
		})
		.from(echo)

	if (rows.length === 0) {
		return
	}

	const userStats = new Map<string, { totalPosts: number; totalPostScore: number }>()
	const transaction = redis.multi()

	for (const row of rows) {
		const postScore = getPostScore(row)
		transaction.zadd(getAllTimePostBoardKey(), postScore, row.id)
		transaction.hset(getAllTimePostStateKey(row.id), {
			authorId: row.authorId,
			score: String(postScore),
		})

		const existing = userStats.get(row.authorId) ?? { totalPosts: 0, totalPostScore: 0 }
		existing.totalPosts += 1
		existing.totalPostScore += postScore
		userStats.set(row.authorId, existing)
	}

	for (const [authorId, stats] of userStats.entries()) {
		const normalizedScore = getNormalizedUserScore(stats.totalPostScore, stats.totalPosts)
		transaction.zadd(getAllTimeUserBoardKey(), normalizedScore, authorId)
		transaction.hset(getAllTimeUserStateKey(authorId), {
			total_posts: String(stats.totalPosts),
			total_post_score: String(stats.totalPostScore),
		})
	}

	await transaction.exec()
}

async function seedWeeklyLeaderboard() {
	const weekKey = getCurrentWeekKey()
	const { userBoardKey, postBoardKey } = getBoardKeys("weekly", weekKey)
	const [userCount, postCount] = await Promise.all([
		redis.zcard(userBoardKey),
		redis.zcard(postBoardKey),
	])

	if (userCount > 0 || postCount > 0) {
		return
	}

	const rows = await db
		.select({
			id: echo.id,
			authorId: echo.authorId,
			likeCount: echo.likeCount,
			commentCount: echo.commentCount,
			saveCount: echo.saveCount,
		})
		.from(echo)
		.where(gte(echo.createdAt, getCurrentWeekStartDate()))

	if (rows.length === 0) {
		return
	}

	const userStats = new Map<string, { totalPosts: number; totalPostScore: number }>()
	const transaction = redis.multi()

	for (const row of rows) {
		const postScore = getPostScore(row)
		transaction.zadd(postBoardKey, postScore, row.id)
		transaction.hset(getWeeklyPostStateKey(weekKey, row.id), {
			authorId: row.authorId,
			score: String(postScore),
		})

		const existing = userStats.get(row.authorId) ?? { totalPosts: 0, totalPostScore: 0 }
		existing.totalPosts += 1
		existing.totalPostScore += postScore
		userStats.set(row.authorId, existing)
	}

	for (const [authorId, stats] of userStats.entries()) {
		const normalizedScore = getNormalizedUserScore(stats.totalPostScore, stats.totalPosts)
		transaction.zadd(userBoardKey, normalizedScore, authorId)
	}

	await transaction.exec()
}

function parseBoardEntries(raw: string[]) {
	const entries: Array<{ id: string; score: number; rank: number }> = []

	for (let index = 0; index < raw.length; index += 2) {
		entries.push({
			id: raw[index],
			score: toNumber(raw[index + 1]),
			rank: index / 2 + 1,
		})
	}

	return entries
}

async function recalculateAllTimeUserScore(userId: string) {
	const state = await redis.hgetall(getAllTimeUserStateKey(userId))
	const totalPosts = toNumber(state.total_posts)
	const totalPostScore = toNumber(state.total_post_score)
	const normalizedScore = totalPostScore / Math.sqrt(totalPosts + 1)

	await redis.zadd(getAllTimeUserBoardKey(), normalizedScore, userId)
	return normalizedScore
}

export async function recordPostCreated(postId: string, authorId: string) {
	const weekKey = getCurrentWeekKey()
	const transaction = redis.multi()

	transaction.hincrby(getAllTimeUserStateKey(authorId), "total_posts", 1)
	transaction.hset(getAllTimePostStateKey(postId), {
		authorId,
		score: "0",
	})
	transaction.hset(getWeeklyPostStateKey(weekKey, postId), {
		authorId,
		score: "0",
	})

	await transaction.exec()
	await recalculateAllTimeUserScore(authorId)
}

export async function recordPostDeleted(postId: string, authorId: string) {
	const weekKey = getCurrentWeekKey()
	const [allTimeState, weeklyState, userState] = await Promise.all([
		redis.hgetall(getAllTimePostStateKey(postId)),
		redis.hgetall(getWeeklyPostStateKey(weekKey, postId)),
		redis.hgetall(getAllTimeUserStateKey(authorId)),
	])

	const resolvedAuthorId = allTimeState.authorId || authorId
	if (!resolvedAuthorId) {
		return
	}

	const allTimeScore = toNumber(allTimeState.score)
	const weeklyScore = toNumber(weeklyState.score)
	const totalPosts = Math.max(toNumber(userState.total_posts) - 1, 0)
	const totalPostScore = Math.max(toNumber(userState.total_post_score) - allTimeScore, 0)

	const transaction = redis.multi()
	transaction.zrem(getAllTimePostBoardKey(), postId)
	transaction.zrem(getWeeklyPostBoardKey(weekKey), postId)
	transaction.hset(getAllTimeUserStateKey(resolvedAuthorId), {
		total_posts: String(totalPosts),
		total_post_score: String(totalPostScore),
	})
	transaction.del(getAllTimePostStateKey(postId))
	transaction.del(getWeeklyPostStateKey(weekKey, postId))
	if (weeklyScore !== 0) {
		transaction.zincrby(getWeeklyUserBoardKey(weekKey), -weeklyScore, resolvedAuthorId)
	}

	await transaction.exec()
	await recalculateAllTimeUserScore(resolvedAuthorId)
}

export async function recordPostEngagement(options: {
	postId: string
	authorId: string
	delta: number
	type: "like" | "save" | "comment"
}) {
	if (!options.delta) {
		return
	}

	const weekKey = getCurrentWeekKey()
	const scoreDelta = options.delta * ENGAGEMENT_WEIGHTS[options.type]
	const [allTimeState, weeklyState] = await Promise.all([
		redis.hgetall(getAllTimePostStateKey(options.postId)),
		redis.hgetall(getWeeklyPostStateKey(weekKey, options.postId)),
	])

	const resolvedAuthorId = allTimeState.authorId || options.authorId
	if (!resolvedAuthorId) {
		return
	}

	const nextAllTimeScore = Math.max(toNumber(allTimeState.score) + scoreDelta, 0)
	const nextWeeklyScore = Math.max(toNumber(weeklyState.score) + scoreDelta, 0)

	const transaction = redis.multi()
	transaction.hset(getAllTimePostStateKey(options.postId), {
		authorId: resolvedAuthorId,
		score: String(nextAllTimeScore),
	})
	transaction.hset(getWeeklyPostStateKey(weekKey, options.postId), {
		authorId: resolvedAuthorId,
		score: String(nextWeeklyScore),
	})
	transaction.zincrby(getAllTimePostBoardKey(), scoreDelta, options.postId)
	transaction.zincrby(getWeeklyPostBoardKey(weekKey), scoreDelta, options.postId)
	transaction.hincrbyfloat(getAllTimeUserStateKey(resolvedAuthorId), "total_post_score", scoreDelta)
	transaction.zincrby(getWeeklyUserBoardKey(weekKey), scoreDelta, resolvedAuthorId)

	await transaction.exec()
	await recalculateAllTimeUserScore(resolvedAuthorId)
}

export async function recordCommentEngagement(options: {
	postId: string
	authorId: string
	delta: number
}) {
	return recordPostEngagement({
		postId: options.postId,
		authorId: options.authorId,
		delta: options.delta,
		type: "comment",
	})
}

export async function getUserRank(scope: LeaderboardScope, userId: string) {
	const weekKey = getCurrentWeekKey()
	const { userBoardKey } = getBoardKeys(scope, weekKey)
	const rank = await redis.zrevrank(userBoardKey, userId)
	return typeof rank === "number" ? rank + 1 : null
}

export async function getLeaderboardSnapshot(scope: LeaderboardScope, limit = 10) {
	if (scope === "alltime") {
		await seedAllTimeLeaderboard()
	} else {
		await seedWeeklyLeaderboard()
	}

	const weekKey = getCurrentWeekKey()
	const { userBoardKey, postBoardKey } = getBoardKeys(scope, weekKey)
	const [userEntries, postEntries] = await Promise.all([
		redis.zrevrange(userBoardKey, 0, limit - 1, "WITHSCORES"),
		redis.zrevrange(postBoardKey, 0, limit - 1, "WITHSCORES"),
	])

	const users = parseBoardEntries(userEntries)
	const posts = parseBoardEntries(postEntries)

	const userIds = users.map((entry) => entry.id)
	const postIds = posts.map((entry) => entry.id)

	const [userRows, postRows] = await Promise.all([
		userIds.length > 0
			? db
				.select({
					id: user.id,
					name: user.name,
					username: user.username,
					image: user.image,
				})
				.from(user)
				.where(inArray(user.id, userIds))
			: Promise.resolve([]),
		postIds.length > 0
			? db
				.select({
					id: echo.id,
					content: echo.content,
					likeCount: echo.likeCount,
					commentCount: echo.commentCount,
					saveCount: echo.saveCount,
					createdAt: echo.createdAt,
					authorId: user.id,
					authorName: user.name,
					authorUsername: user.username,
					authorImage: user.image,
				})
				.from(echo)
				.innerJoin(user, eq(user.id, echo.authorId))
				.where(inArray(echo.id, postIds))
			: Promise.resolve([]),
	])

	const userRowById = new Map(userRows.map((row) => [row.id, row]))
	const postRowById = new Map(postRows.map((row) => [row.id, row]))

	return {
		weekKey,
		users: users.map((entry) => {
			const row = userRowById.get(entry.id)
			return {
				id: entry.id,
				rank: entry.rank,
				score: entry.score,
				name: row?.name ?? "Unknown",
				username: row?.username ?? "unknown",
				image: row?.image ?? null,
			}
		}),
		posts: posts.map((entry) => {
			const row = postRowById.get(entry.id)
			return {
				id: entry.id,
				rank: entry.rank,
				score: entry.score,
				content: row?.content ?? "",
				authorId: row?.authorId ?? "",
				authorName: row?.authorName ?? "Unknown",
				authorUsername: row?.authorUsername ?? "unknown",
				authorImage: row?.authorImage ?? null,
				likeCount: Number(row?.likeCount ?? 0),
				commentCount: Number(row?.commentCount ?? 0),
				saveCount: Number(row?.saveCount ?? 0),
				createdAt: row?.createdAt ? row.createdAt.toISOString() : "",
			}
		}),
	}
}
