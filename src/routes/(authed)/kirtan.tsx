import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(authed)/kirtan')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(authed)/kirtan"!</div>
}
