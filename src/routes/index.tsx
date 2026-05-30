import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

export const Route = createFileRoute("/")({
  loader: async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    return {
      isAuthenticated: Boolean(session?.user),
    }
  },
  head: () => ({
    meta: [
      {
        title: "Greem ",
      },
      {
        name: "description",
        content:
          "Discover Greem, a social platform for short posts, follows, reactions, and a live Redis leaderboard.",
      },
      {
        name: "robots",
        content: "index,follow",
      },
    ],
  }),
  component: App,
})

function App() {
  const { isAuthenticated } = Route.useLoaderData()

  return (
    <div className="relative">
      <div className="absolute top-8 flex w-full items-center justify-center">
        <a href="https://github.com/kirtanpatel01/greem" target="_blank">
          <button className="flex items-center gap-2 bg-white text-black border border-black dark:border-white px-2 py-1">
            Github
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
              alt="github-logo"
              className="size-6"
            />
          </button>
        </a>
        <ModeToggle className="ring-black dark:ring-white" />
      </div>
      <div className="absolute top-28 right-32 w-full max-w-72 space-y-2 border p-4 text-center">
        <div className="font-semibol w-full border-b border-primary/50 pb-2 text-lg">
          Why ?
        </div>
        <p className="text-muted-foreground">
          The whole purpose of this platform is to understand how to use Redis
          in a leaderboard.
        </p>
      </div>
      <div className="absolute top-48 left-32 w-full max-w-96 space-y-2 border p-4">
        <div className="font-semibol w-full border-b border-primary/50 pb-2 text-center text-lg">
          Features
        </div>
        <ul className="list-inside list-disc text-sm text-muted-foreground marker:text-primary">
          <li>Real-time leaderboard updates</li>
          <li>Text form sharable content</li>
          <li>Like, comment on posts or save it for later</li>
          <li>Follow your friends and see their posts in your feed</li>
        </ul>
      </div>

      <div className="absolute bottom-28 left-52 w-full max-w-96 space-y-2 border p-4 text-center">
        <div className="font-semibol w-full border-b border-primary/50 pb-2 text-lg">
          How ?
        </div>
        <p className="text-sm text-muted-foreground">
          Whenever you perform any interaction(liking, commeting, saving...) the
          algo will calculate that post&apos;s score and update the leaderboard
          in real-time using Redis sorted sets.
        </p>
      </div>

      <div className="absolute bottom-28 right-48 space-y-2 border p-4 text-center">
        <div className="font-semibol w-full border-b border-primary/50 pb-2 text-lg">Have thoughts ?</div>
        <div className="max-w-48 text-sm text-muted-foreground">
          Drop a quick note, idea, or bug report. We read every message.
        </div>
        <Button variant="outline">
          <Link to="/feedback">feedback</Link>
        </Button>
      </div>

      <div className="flex min-h-svh flex-col items-center justify-center">
        <h1 className="cursor-default text-[10rem] font-black transition-colors duration-500 hover:text-primary">
          Greem
        </h1>
        <p className="text-lg text-muted-foreground">
          A twitter like platform where you can share your thoughts!
        </p>
        <div className="mt-8 flex items-center gap-10">
          {isAuthenticated ? (
            <Button>
              <Link to="/feed">Go to Feed</Link>
            </Button>
          ) : (
            <>
              <Button variant="secondary">
                <Link to="/login">Login</Link>
              </Button>
              <Button>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
