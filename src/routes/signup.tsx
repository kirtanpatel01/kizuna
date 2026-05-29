import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { SignupForm } from "@/components/signup-form"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      {
        title: "Sign up | Greem",
      },
      {
        name: "description",
        content: "Create a Greem account to join the feed, follow users, and post echoes.",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const canGoBack = typeof window !== "undefined" && window.history.length > 1

  return (
    <div className="relative flex min-h-svh w-full items-center">
      <Button
        variant="outline"
        // size="icon"
        className="absolute top-4 left-4 z-20"
        onClick={() => {
          if (canGoBack && typeof window !== "undefined") {
            try {
              window.history.back()
            } catch (_) {
              /* no-op */
            }
          }
        }}
        disabled={!canGoBack}
        aria-label="Go back"
      >
        <ArrowLeft />
        Back
      </Button>
      <ModeToggle className="absolute top-4 right-4" />
      <SignupForm className="w-full max-w-md mx-auto ring-0" />
    </div>
  )
}
