import { redis } from "@/lib/redis"

import {
	getAllTimePostBoardKey,
	getAllTimePostStateKey,
	getAllTimeUserBoardKey,
	getAllTimeUserStateKey,
	getCurrentWeekKey,
	getWeeklyPostBoardKey,
	getWeeklyPostStateKey,
	getWeeklyUserBoardKey,
} from "./keys"
import { ENGAGEMENT_WEIGHTS, toNumber } from "./scoring"

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
	try {
		await redis.publish("leaderboard:updates", JSON.stringify({ event: "postCreated", postId, authorId, weekKey }))
	} catch (err) {
		console.warn("failed to publish leaderboard postCreated", err)
	}
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
	try {
		await redis.publish("leaderboard:updates", JSON.stringify({ event: "postDeleted", postId, authorId: resolvedAuthorId, weekKey }))
	} catch (err) {
		console.warn("failed to publish leaderboard postDeleted", err)
	}
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
	const normalized = await recalculateAllTimeUserScore(resolvedAuthorId)
	try {
		await redis.publish(
			"leaderboard:updates",
			JSON.stringify({
				event: "postScoreUpdated",
				postId: options.postId,
				authorId: resolvedAuthorId,
				nextAllTimeScore,
				nextWeeklyScore,
				weekKey,
			}),
		)
		await redis.publish(
			"leaderboard:updates",
			JSON.stringify({
				event: "userScoreUpdated",
				userId: resolvedAuthorId,
				normalizedScore: normalized,
			}),
		)
	} catch (err) {
		console.warn("failed to publish leaderboard updates", err)
	}
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