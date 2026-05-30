import AppSidebar from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { CircleUserRound, Hexagon, Trophy, UserCog } from "lucide-react"

export const Route = createFileRoute("/(authed)")({
  head: () => ({
    meta: [
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: RouteComponent,
})

const mobileNavItems = [
  {
    name: "Feed",
    to: "/feed" as const,
    icon: Hexagon,
  },
  {
    name: "Leaderboard",
    to: "/leaderboard" as const,
    icon: Trophy,
  },
  {
    name: "Profile",
    to: "/profile" as const,
    icon: CircleUserRound,
  },
  {
    name: "Account",
    to: "/account" as const,
    icon: UserCog,
  },
]

function RouteComponent() {
  return (
    <div>
      {/* hemkndd */}
      <TooltipProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "12rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <main className="w-full pb-20 md:pb-0">
            <Outlet />
          </main>
        </SidebarProvider>
      </TooltipProvider>

      {/* Bottom Tabs Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/95 backdrop-blur-md z-50 flex md:hidden justify-around items-center px-2">
        {mobileNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
            activeProps={{ className: "!text-primary font-medium" }}
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

