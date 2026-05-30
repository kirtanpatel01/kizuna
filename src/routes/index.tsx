import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { getCurrentUser } from "@/actions/auth.actions"

export const Route = createFileRoute("/")({
  loader: async () => {
    const user = await getCurrentUser()

    return {
      isAuthenticated: Boolean(user),
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
    <div className="relative min-h-screen flex flex-col lg:block overflow-x-hidden">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between lg:justify-center lg:gap-10 px-6 py-4 lg:py-0 lg:px-0 lg:absolute lg:top-8 z-20">
        <a href="https://github.com/kirtanpatel01/greem" target="_blank">
          <button className="flex items-center gap-2 bg-white text-black border border-black dark:border-white px-2 py-1 cursor-pointer">
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

      {/* Main Brand Section */}
      <div className="flex flex-col items-center justify-center text-center pt-24 pb-12 lg:min-h-screen lg:py-0">
        <h1 className="cursor-default text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black transition-colors duration-500 hover:text-primary leading-none">
          Greem
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground px-4">
          A twitter like platform where you can share your thoughts!
        </p>
        <div className="mt-8 flex items-center gap-6 sm:gap-10">
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

      {/* Info Cards - Grid on mobile, absolute on desktop */}
      <div className="w-full max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6 lg:contents">
        {/* Why Card */}
        <div className="relative w-full space-y-2 border p-4 text-center lg:absolute lg:top-28 lg:right-32 lg:max-w-72 lg:w-full lg:m-0">
          <div className="font-semibold w-full border-b border-primary/50 pb-2 text-lg">
            Why ?
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            The whole purpose of this platform is to understand how to use Redis
            in a leaderboard.
          </p>
        </div>

        {/* Features Card */}
        <div className="relative w-full space-y-2 border p-4 lg:absolute lg:top-48 lg:left-32 lg:max-w-96 lg:w-full lg:m-0">
          <div className="font-semibold w-full border-b border-primary/50 pb-2 text-center text-lg">
            Features
          </div>
          <ul className="list-inside list-disc text-sm text-muted-foreground marker:text-primary">
            <li>Real-time leaderboard updates</li>
            <li>Text form sharable content</li>
            <li>Like, comment on posts or save it for later</li>
            <li>Follow your friends and see their posts in your feed</li>
          </ul>
        </div>

        {/* How Card */}
        <div className="relative w-full space-y-2 border p-4 text-center lg:absolute lg:bottom-28 lg:left-52 lg:max-w-96 lg:w-full lg:m-0">
          <div className="font-semibold w-full border-b border-primary/50 pb-2 text-lg">
            How ?
          </div>
          <p className="text-sm text-muted-foreground">
            Whenever you perform any interaction(liking, commenting, saving...) the
            algo will calculate that post&apos;s score and update the leaderboard
            in real-time using Redis sorted sets.
          </p>
        </div>

        {/* Have Thoughts Card */}
        <div className="relative w-full space-y-2 border p-4 text-center lg:absolute lg:bottom-28 lg:right-48 lg:max-w-72 lg:w-full lg:m-0">
          <div className="font-semibold w-full border-b border-primary/50 pb-2 text-lg">Have thoughts ?</div>
          <div className="max-w-48 mx-auto text-sm text-muted-foreground mb-2">
            Drop a quick note, idea, or bug report. We read every message.
          </div>
          <Button variant="outline">
            <Link to="/feedback">feedback</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
