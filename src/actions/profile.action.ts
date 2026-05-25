import { createServerFn } from "@tanstack/react-start"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profile, user as userTable } from "@/lib/schema"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { eq, or } from "drizzle-orm"

type ProfileGender = "male" | "female" | "no"

function toDateValue(value: unknown) {
	if (typeof value !== "string") return null
	return value
}

export const upsertProfile = createServerFn({ method: "POST" })
	.inputValidator((input) => {
		if (!input || typeof input !== "object") {
			throw new Error("Invalid input")
		}

		const payload = input as Record<string, unknown>
		const dob = toDateValue(payload.dob)
		const gender = payload.gender as ProfileGender | undefined

		return {
			dob,
			gender:
				gender === "male" || gender === "female" || gender === "no"
					? gender
					: null,
			bio: typeof payload.bio === "string" ? payload.bio : null,
			isPrivate: Boolean(payload.isPrivate ?? false),
		}
	})
	.handler(async ({ data }) => {
		const headers = getRequestHeaders()
		const session = await auth.api.getSession({ headers })
		const userId = session?.user?.id

		if (!userId) {
			return { success: false, message: "Not authenticated" }
		}

		await db
			.insert(profile)
			.values({
				userId,
				dob: data.dob,
				gender: data.gender,
				bio: data.bio,
				isPrivate: data.isPrivate,
			})
			.onConflictDoUpdate({
				target: profile.userId,
				set: {
					dob: data.dob,
					gender: data.gender,
					bio: data.bio,
					isPrivate: data.isPrivate,
				},
			})

		return { success: true, message: "Profile saved" }
	})

	export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
		const headers = getRequestHeaders()
		const session = await auth.api.getSession({ headers })
		const userId = session?.user?.id

		if (!userId) return null

		const [row] = await db
			.select({ dob: profile.dob, gender: profile.gender, bio: profile.bio })
			.from(profile)
			.where(eq(profile.userId, userId))
			.limit(1)

		if (!row) return null

		return {
			dob: row.dob ? (row.dob as unknown as string) : null,
			gender: row.gender ?? null,
			bio: row.bio ?? null,
		}
	})

	export const getPublicProfile = createServerFn({ method: "GET" })
		.inputValidator((input) => {
			if (!input || typeof input !== "object") {
				throw new Error("Invalid input")
			}

			const payload = input as Record<string, unknown>
			const userId = typeof payload.userId === "string" ? payload.userId.trim() : ""

			if (!userId) {
				throw new Error("User id is required")
			}

			return { userId }
		})
		.handler(async ({ data }) => {
			const [row] = await db
				.select({
					id: userTable.id,
					name: userTable.name,
					username: userTable.username,
					image: userTable.image,
					bio: profile.bio,
				})
				.from(userTable)
				.leftJoin(profile, eq(profile.userId, userTable.id))
				.where(or(eq(userTable.id, data.userId), eq(userTable.username, data.userId)))
				.limit(1)

			if (!row) return null

			return {
				id: row.id,
				name: row.name,
				username: row.username,
				image: row.image,
				bio: row.bio ?? null,
				followersCount: 0,
				followingCount: 0,
			}
		})
