"use server"

import { createServerFn } from "@tanstack/react-start"
import * as z from "zod"

import { db } from "@/lib/db"
import { feedbackSubmission } from "@/lib/schema"

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters long.")
    .max(2000, "Message must be 2000 characters or fewer."),
})

export type FeedbackValues = z.infer<typeof feedbackSchema>

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input) => feedbackSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await db.insert(feedbackSubmission).values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        message: data.message,
      })

      return {
        success: true,
        message: "Thanks for your feedback. We received your message.",
      }
    } catch (error) {
      console.error("Failed to store feedback", error)

      return {
        success: false,
        message: "We couldn't save your feedback right now. Please try again.",
      }
    }
  })