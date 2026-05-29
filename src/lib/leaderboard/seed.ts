import { gte } from "drizzle-orm"

import { db } from "@/lib/db"
import { echo } from "@/lib/schema"
import { redis } from "@/lib/redis"

import {
	getAllTimePostBoardKey,
	getAllTimePostStateKey,
	getAllTimeUserBoardKey,
	getAllTimeUserStateKey,
	getBoardKeys,
	getCurrentWeekKey,
	getCurrentWeekStart,
	getWeeklyPostStateKey,
	getWeeklyUserBoardKey,
} from "./keys"
import { getNormalizedUserScore, getPostScore } from "./scoring"

export async function seedAllTimeLeaderboard() {
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

export async function seedWeeklyLeaderboard() {
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
		.where(gte(echo.createdAt, getCurrentWeekStart()))

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