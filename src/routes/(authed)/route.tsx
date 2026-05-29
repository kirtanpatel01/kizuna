import AppSidebar from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createFileRoute, Outlet } from "@tanstack/react-router"

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

function RouteComponent() {
  return (
    <div>
      hemkndd
      <TooltipProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "12rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <main className="w-full">
            <Outlet />
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
