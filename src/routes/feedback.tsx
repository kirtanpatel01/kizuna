import { zodResolver } from "@hookform/resolvers/zod"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Controller, useForm, type FieldError as RHFFieldError } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { submitFeedback } from "@/actions/feedback.actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute('/feedback')({
  head: () => ({
    meta: [
      {
        title: "Feedback | Greem",
      },
      {
        name: "description",
        content:
          "Send product feedback, feature ideas, or bug reports to the Greem team.",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: RouteComponent,
})

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters long.")
    .max(2000, "Message must be 2000 characters or fewer."),
})

type FeedbackValues = z.infer<typeof feedbackSchema>

function RouteComponent() {
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    // mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  async function onSubmit(data: FeedbackValues) {
    form.clearErrors("root")

    const result = await submitFeedback({ data })

    if (!result.success) {
      form.setError("root", {
        message: result.message || "Unable to submit feedback.",
      })
      return
    }

    toast.success(result.message || "Feedback submitted successfully.")
    form.reset()
    // navigate({ to: "/feedback/res" })
  }

  return (
    <div className="min-h-svh px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Share your feedback</CardTitle>
            <CardDescription>
              Send us your name, email, and message. We store every submission in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="gap-5">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="text"
                        placeholder="Your full name"
                        aria-invalid={fieldState.invalid}
                        autoComplete="name"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error as RHFFieldError]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="email"
                        placeholder="you@example.com"
                        aria-invalid={fieldState.invalid}
                        autoComplete="email"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error as RHFFieldError]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="message"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Message</FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        placeholder="Tell us what is working, what is confusing, or what you want next."
                        aria-invalid={fieldState.invalid}
                        className="min-h-32"
                        rows={16}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error as RHFFieldError]} />
                      )}
                    </Field>
                  )}
                />

                {form.formState.errors.root?.message && (
                  <FieldError>{form.formState.errors.root.message}</FieldError>
                )}

                <Field>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Sending..." : "Submit feedback"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
            <CardDescription>
              Your feedback is saved with a timestamp so we can review it later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>We keep the message, contact email, and name together for follow-up.</p>
            <p>You can also return to the home page if you need to keep browsing.</p>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
