"use server"

import { createServerFn } from "@tanstack/react-start"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getRequestHeaders } from "@tanstack/react-start/server"
import ImageKit from "@imagekit/nodejs"

export const signupUser = createServerFn({ method: "POST" })
  .inputValidator((input) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid form data")
    }
    const payload = input as Record<string, unknown>
    return {
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      username: String(payload.username ?? ""),
      password: String(payload.password ?? ""),
    }
  })
  .handler(async ({ data }) => {
    const { username, email, name, password } = data

    // Ensure username is unique
    const existing = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
    if (existing.length > 0) {
      return { success: false, message: "Username already taken" }
    }

    try {
      const user = await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
          callbackURL: "/",
        },
      })

      await db
        .update(userTable)
        .set({ username: username })
        .where(eq(userTable.id, user.user.id))

      return { success: true, message: "User created successfully" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((input) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid form data")
    }
    const payload = input as Record<string, unknown>
    return {
      email: String(payload.email ?? ""),
      username: String(payload.username ?? ""),
      password: String(payload.password ?? ""),
      withEmail: Boolean(payload.withEmail ?? false),
    }
  })
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const { email, username, password, withEmail } = data
    let userEmail = email
    if (!withEmail) {
      const data = await db
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.username, username))
        .limit(1)
      userEmail = data[0]?.email
    }
    try {
      await auth.api.signInEmail({
        body: {
          email: withEmail ? email : userEmail, // required
          password, // required
          rememberMe: true,
          callbackURL: "/",
        },
        // This endpoint requires session cookies.
        headers,
      })
      return { success: true, message: "Login successful" }
    } catch (error) {
      console.log("Error while login: ", error)
      return { success: false, message: "Something went wrnog while login!" }
    }
  })

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      await auth.api.signOut()
      return { success: true, message: "Logged out successfully" }
    } catch (error) {
      console.log("Error while logout: ", error)
      return { success: false, message: "Something went wrong while logout!" }
    }
  }
)

export const getCurrentUser = createServerFn({ method: "GET" })
  .handler(async () => {
    const headers = getRequestHeaders()
    try {
      const session = await auth.api.getSession({ headers })
      const userId = session?.user?.id
      if (!userId) return null

      const [user] = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          username: userTable.username,
          email: userTable.email,
          emailVerified: userTable.emailVerified,
          image: userTable.image,
          createdAt: userTable.createdAt,
          updatedAt: userTable.updatedAt,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1)

      if (!user) return null

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
      }
    } catch (error) {
      console.log('getCurrentUser error', error)
      return null
    }
  })

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((input) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input")
    const payload = input as Record<string, unknown>
    return {
      name: String(payload.name ?? ""),
      username: String(payload.username ?? ""),
      image: typeof payload.image === "string" ? payload.image : undefined,
    }
  })
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id
    if (!userId) return { success: false, message: "Not authenticated" }

    // Ensure username is unique (allow current user's username)
    const existing = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, data.username))
      .limit(1)

    if (existing.length > 0 && existing[0].id !== userId) {
      return { success: false, message: "Username already taken" }
    }

    try {
      await db
        .update(userTable)
        .set({
          name: data.name,
          username: data.username,
          ...(data.image ? { image: data.image } : {}),
        })
        .where(eq(userTable.id, userId))

      return { success: true }
    } catch (error) {
      console.log('updateProfile error', error)
      return { success: false, message: 'Failed to update profile' }
    }
  })

export const getImageKitAuth = createServerFn({ method: "GET" })
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session?.user) {
      return { success: false, message: "Not authenticated" }
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY

    if (!privateKey || !publicKey) {
      return {
        success: false,
        message: "Missing ImageKit environment variables",
      }
    }

    const client = new ImageKit({ privateKey })
    const { token, expire, signature } = client.helper.getAuthenticationParameters()

    return {
      success: true,
      token,
      expire,
      signature,
      publicKey,
    }
  })
