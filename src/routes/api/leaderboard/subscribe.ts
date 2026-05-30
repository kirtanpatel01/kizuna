import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/leaderboard/subscribe")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const headers = new Headers({
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        })

        const Redis = (await import("ioredis")).default
        const subscriber = new Redis(process.env.REDIS_URL!)

        const stream = new ReadableStream({
          start(controller) {
            // relay messages from Redis pub/sub as SSE
            const onMessage = (_channel: string, message: string) => {
              try {
                controller.enqueue(`data: ${message}\n\n`)
              } catch (err) {
                // ignore
              }
            }

            subscriber.subscribe("leaderboard:updates").then(() => {
              subscriber.on("message", onMessage)
            }).catch(() => {
              controller.enqueue(`data: ${JSON.stringify({ event: 'error', message: 'subscribe failed' })}\n\n`)
            })

            request.signal.addEventListener("abort", () => {
              try {
                subscriber.off("message", onMessage)
                subscriber.disconnect()
              } catch {}
              controller.close()
            })
          },
        })

        return new Response(stream, { headers })
      },
    },
  },
})
