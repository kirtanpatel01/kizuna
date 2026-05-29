import { eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { echo, user } from "@/lib/schema"
import { redis } from "@/lib/redis"

import { getBoardKeys, getCurrentWeekKey } from "./keys"
import { seedAllTimeLeaderboard, seedWeeklyLeaderboard } from "./seed"
import { toNumber } from "./scoring"

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

export async function getLeaderboardSnapshot(scope: "alltime" | "weekly", limit = 10) {
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

export async function getUserRank(scope: "alltime" | "weekly", userId: string) {
	const weekKey = getCurrentWeekKey()
	const { userBoardKey } = getBoardKeys(scope, weekKey)
	const rank = await redis.zrevrank(userBoardKey, userId)
	return typeof rank === "number" ? rank + 1 : null
}