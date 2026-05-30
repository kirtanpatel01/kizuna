import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAccount } from '@/hooks/use-account'

type AccountHeaderProps = {
  title: string
  description: string
}

export function AccountHeader({ title, description }: AccountHeaderProps) {
  const account = useAccount()

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {!account.editing && (
          <Button variant="secondary" onClick={account.startEditing}>
            Edit
          </Button>
        )}
        <Button variant="destructive" onClick={account.handleLogout} disabled={account.loggingOut}>
          {account.loggingOut ? <Spinner className="size-4" /> : 'Log out'}
        </Button>
      </div>
    </div>
  )
}
