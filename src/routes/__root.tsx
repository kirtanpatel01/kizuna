import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import appCss from "../styles.css?url"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/providers/query-provider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Greem",
      },
      {
        name: "description",
        content:
          "Greem is a Redis-powered social platform for short posts, live rankings, and profile-driven discovery.",
      },
      {
        name: "theme-color",
        content: "#c70036",
      },
      {
        property: "og:title",
        content: "Greem",
      },
      {
        property: "og:description",
        content:
          "Greem is a Redis-powered social platform for short posts, live rankings, and profile-driven discovery.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Greem",
      },
      {
        name: "twitter:description",
        content:
          "Greem is a Redis-powered social platform for short posts, live rankings, and profile-driven discovery.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/greem.svg",
        type: "image/svg+xml",
      },
      {
        rel: "shortcut icon",
        href: "/greem.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/greem.svg",
        type: "image/svg+xml",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
