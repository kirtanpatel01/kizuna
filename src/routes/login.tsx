import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/login-form"
import { ModeToggle } from "@/components/mode-toggle"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      {
        title: "Login | Greem",
      },
      {
        name: "description",
        content: "Sign in to your Greem account to post, follow, and react.",
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
        // size=""
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
      <LoginForm className="mx-auto w-full max-w-md ring-0" />
    </div>
  )
}
