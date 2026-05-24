import { Input } from '@/components/ui/input'
import { useAccountContext } from '@/providers/account-provider'

type AccountInfoFieldProps = {
  label: string
  field: 'name' | 'username' | 'email' | 'emailVerified'
}

export function AccountInfoField({ label, field }: AccountInfoFieldProps) {
  const account = useAccountContext()

  const value =
    field === 'name'
      ? account.user?.name ?? '—'
      : field === 'username'
        ? account.user?.username ?? '—'
        : field === 'email'
          ? account.user?.email ?? '—'
          : account.user?.emailVerified
            ? 'Yes'
            : 'No'

  const isEditable = field === 'name' || field === 'username'

  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1">
        {account.editing && isEditable ? (
          <Input
            value={field === 'name' ? account.formName : account.formUsername}
            onChange={(e) =>
              field === 'name'
                ? account.setFormName(e.target.value)
                : account.setFormUsername(e.target.value)
            }
          />
        ) : (
          <div className="font-medium">{value}</div>
        )}
      </div>
    </div>
  )
}
