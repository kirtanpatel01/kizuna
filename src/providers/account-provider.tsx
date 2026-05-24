import { createContext, useContext, type ReactNode } from 'react'
import { useAccount } from '@/hooks/use-account'

export type AccountContextValue = ReturnType<typeof useAccount>

const AccountContext = createContext<AccountContextValue | null>(null)

type AccountProviderProps = {
  children: ReactNode
}

export function AccountProvider({ children }: AccountProviderProps) {
  const account = useAccount()

  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>
}

export function useAccountContext() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccountContext must be used within an AccountProvider')
  }

  return context
}
