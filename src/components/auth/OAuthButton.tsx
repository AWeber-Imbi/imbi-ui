import {
  Github as GitHubIcon,
  Mail as GoogleIcon,
  Key as KeyIcon,
  LucideIcon,
  Clock as OIDCIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface OAuthButtonProps {
  provider: {
    id: string
    name: string
    icon?: string | null
  }
  onClick: () => void
  disabled?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  google: GoogleIcon,
  github: GitHubIcon,
  oidc: OIDCIcon,
  key: KeyIcon,
}

export function OAuthButton({ provider, onClick, disabled }: OAuthButtonProps) {
  const Icon = iconMap[provider.icon ?? ''] || KeyIcon

  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
      Continue with {provider.name}
    </Button>
  )
}
