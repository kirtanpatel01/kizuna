import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const next = (current: string) => {
    if (current === 'system') return 'light'
    if (current === 'light') return 'dark'
    return 'system'
  }

  const Icon = theme === 'dark' ? Moon : Sun

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next(theme))}
      aria-label="Toggle theme"
      className={className}
    >
      <Icon />
    </Button>
  )
}
