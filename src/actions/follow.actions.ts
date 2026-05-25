"use server"

import { createServerFn } from "@tanstack/react-start"
import { and, count, eq } from "drizzle-orm"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { follow, user as userTable } from "@/lib/schema"

function toUsername(value: unknown) {
	if (typeof value !== "string") return ""
	return value.trim()
}

async function getViewerId() {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	return session?.user?.id ?? null
}

async function resolveTargetUsername(username: string) {
	const [row] = await db
		.select({ id: userTable.id, username: userTable.username })
		.from(userTable)
		.where(eq(userTable.username, username))
		.limit(1)

	return row ?? null
}

export const followUser = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const username = toUsername(payload.username)

		if (!username) {
			throw new Error("Username is required")
		}

		return { username }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()
		if (!viewerId) {
			return { success: false, message: "Not authenticated" }
		}

		const target = await resolveTargetUsername(data.username)
		if (!target) {
			return { success: false, message: "User not found" }
		}

		if (viewerId === target.id) {
			return { success: false, message: "You cannot follow yourself" }
		}

		await db
			.insert(follow)
			.values({ followerId: viewerId, followingId: target.id })
			.onConflictDoNothing()

		return { success: true, message: "Followed" }
	})

export const unfollowUser = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const username = toUsername(payload.username)

		if (!username) {
			throw new Error("Username is required")
		}

		return { username }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()
		if (!viewerId) {
			return { success: false, message: "Not authenticated" }
		}

		const target = await resolveTargetUsername(data.username)
		if (!target) {
			return { success: false, message: "User not found" }
		}

		await db
			.delete(follow)
			.where(and(eq(follow.followerId, viewerId), eq(follow.followingId, target.id)))

		return { success: true, message: "Unfollowed" }
	})

export const getFollowState = createServerFn({ method: "GET" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const username = toUsername(payload.username)

		if (!username) {
			throw new Error("Username is required")
		}

		return { username }
	})
	.handler(async ({ data }) => {
		const viewerId = await getViewerId()
		const target = await resolveTargetUsername(data.username)

		if (!target) {
			return { isFollowing: false, isOwnProfile: false }
		}

		if (!viewerId) {
			return { isFollowing: false, isOwnProfile: false }
		}

		const isOwnProfile = viewerId === target.id
		if (isOwnProfile) {
			return { isFollowing: false, isOwnProfile: true }
		}

		const [row] = await db
			.select({ count: count() })
			.from(follow)
			.where(and(eq(follow.followerId, viewerId), eq(follow.followingId, target.id)))

		return {
			isFollowing: (row?.count ?? 0) > 0,
			isOwnProfile: false,
		}
	})

export const getFollowCounts = createServerFn({ method: "GET" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const username = toUsername(payload.username)

		if (!username) {
			throw new Error("Username is required")
		}

		return { username }
	})
	.handler(async ({ data }) => {
		const target = await resolveTargetUsername(data.username)
		if (!target) {
			return { followersCount: 0, followingCount: 0 }
		}

		const [followersRow] = await db
			.select({ count: count() })
			.from(follow)
			.where(eq(follow.followingId, target.id))

		const [followingRow] = await db
			.select({ count: count() })
			.from(follow)
			.where(eq(follow.followerId, target.id))

		return {
			followersCount: Number(followersRow?.count ?? 0),
			followingCount: Number(followingRow?.count ?? 0),
		}
	})
