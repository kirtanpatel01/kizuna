import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh p-6">
      <Link to="/signup">
        <Button>Signup</Button>
      </Link>
      <Link to="/login">
        <Button>Login</Button>
      </Link>
    </div>
  )
}
