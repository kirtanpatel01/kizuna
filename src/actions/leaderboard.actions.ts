"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"
import {
	getLeaderboardSnapshot,
	getUserRank,
	type LeaderboardPostEntry,
	type LeaderboardUserEntry,
} from "@/lib/leaderboard.server"

export type LeaderboardBoardSnapshot = {
	weekKey: string | null
	users: LeaderboardUserEntry[]
	posts: LeaderboardPostEntry[]
}

export type LeaderboardData = {
	alltime: LeaderboardBoardSnapshot
	weekly: LeaderboardBoardSnapshot
	viewer: {
		id: string | null
		alltimeUserRank: number | null
		weeklyUserRank: number | null
	}
}

export const getLeaderboardData = createServerFn({ method: "GET" }).handler(async (): Promise<LeaderboardData> => {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	const viewerId = session?.user?.id ?? null

	let alltime: LeaderboardBoardSnapshot = { weekKey: null, users: [], posts: [] }
	let weekly: LeaderboardBoardSnapshot = { weekKey: null, users: [], posts: [] }
	let alltimeUserRank: number | null = null
	let weeklyUserRank: number | null = null

	try {
		;[alltime, weekly] = await Promise.all([
			getLeaderboardSnapshot("alltime"),
			getLeaderboardSnapshot("weekly"),
		])

		if (viewerId) {
			;[alltimeUserRank, weeklyUserRank] = await Promise.all([
				getUserRank("alltime", viewerId),
				getUserRank("weekly", viewerId),
			])
		}
	} catch (error) {
		console.warn("[leaderboard] falling back to empty state:", error)
	}

	return {
		alltime,
		weekly,
		viewer: {
			id: viewerId,
			alltimeUserRank,
			weeklyUserRank,
		},
	}
})
