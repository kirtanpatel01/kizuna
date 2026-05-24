import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const next = (current: string) => {
    if (current === 'system') return 'light'
    if (current === 'light') return 'dark'
    return 'system'
  }

  const Icon = theme === 'dark' ? Moon : Sun

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(next(theme))}
      aria-label="Toggle theme"
    >
      <Icon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  )
}
