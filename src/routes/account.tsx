import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  AccountProvider,
  useAccountContext,
} from "@/providers/account-provider"
// import { AccountActions } from "@/components/account/account-actions"
import { AccountAvatarSection } from "@/components/account/account-avatar-section"
import { AccountHeader } from "@/components/account/account-header"
import { AccountInfoField } from "@/components/account/account-info-field"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/account")({
  component: RouteComponent,
})

function AccountContent() {
  const account = useAccountContext()

  if (account.loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    )

  if (!account.user)
    return (
      <div className="p-8">
        <Card>
          <CardContent>You are not signed in.</CardContent>
        </Card>
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <AccountHeader
            title="Account"
            description="Manage your account information"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AccountInfoField label="Full name" field="name" />
            <AccountInfoField label="Username" field="username" />
            <AccountInfoField label="Email" field="email" />
            <AccountInfoField label="Email verified" field="emailVerified" />
            <AccountAvatarSection />
          </div>
        </CardContent>
        {account.editing && (
          <CardFooter className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              onClick={account.cancelEditing}
              disabled={account.saving}
            >
              Cancel
            </Button>
            <Button onClick={account.handleSave} disabled={account.saving}>
              {account.saving ? <Spinner className="size-4" /> : "Save"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

function RouteComponent() {
  return (
    <AccountProvider>
      <AccountContent />
    </AccountProvider>
  )
}
