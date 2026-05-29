import { Link } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "./ui/sidebar"
import { CircleUserRound, Club, Hexagon, Trophy, UserCog } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

function AppSidebar() {
  const links = [
    {
      name: "Feed",
      href: "/feed",
      icon: <Hexagon />,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy />,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <CircleUserRound />,
    },
    {
      name: "Account",
      href: "/account",
      icon: <UserCog />,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex justify-between">
          <SidebarMenuButton>
            <Club />
            <span className="font-bold">Greem</span>
          </SidebarMenuButton>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {links.map((link) => (
              <Link key={link.href} to={link.href} className="w-full">
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    {link.icon}
                    {link.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-row group-data-[collapsible=icon]:flex-col justify-between">
        <ModeToggle />
        <SidebarTrigger />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
