import { SignupForm } from "@/components/signup-form"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="w-full flex items-center min-h-svh">
      <SignupForm className="w-full max-w-md mx-auto ring-0" />
    </div>
  )
}
