import type { LeaderboardScope } from "./types"

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

export function getCurrentWeekStart(date = new Date()) {
	return getCurrentWeekStartDate(date)
}

export function getAllTimeUserBoardKey() {
	return "leaderboard:users:alltime"
}

export function getAllTimePostBoardKey() {
	return "leaderboard:posts:alltime"
}

export function getWeeklyUserBoardKey(weekKey: string) {
	return `leaderboard:users:weekly:${weekKey}`
}

export function getWeeklyPostBoardKey(weekKey: string) {
	return `leaderboard:posts:weekly:${weekKey}`
}

export function getAllTimeUserStateKey(userId: string) {
	return `leaderboard:state:users:alltime:${userId}`
}

export function getAllTimePostStateKey(postId: string) {
	return `leaderboard:state:posts:alltime:${postId}`
}

export function getWeeklyPostStateKey(weekKey: string, postId: string) {
	return `leaderboard:state:posts:weekly:${weekKey}:${postId}`
}

export function getBoardKeys(scope: LeaderboardScope, weekKey = getCurrentWeekKey()) {
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