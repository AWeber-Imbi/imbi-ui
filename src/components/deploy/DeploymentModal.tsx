import { GitMerge, Rocket } from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Environment } from '@/types'

import { DeployTab } from './DeployTab'

export type DeployModalTab = 'deploy' | 'promote'

interface DeploymentModalProps {
  environments: Environment[]
  initialEnvSlug?: string
  initialTab?: DeployModalTab
  onOpenChange: (open: boolean) => void
  open: boolean
  orgSlug: string
  projectId: string
  projectName: string
}

export function DeploymentModal({
  environments,
  initialEnvSlug,
  initialTab = 'deploy',
  onOpenChange,
  open,
  orgSlug,
  projectId,
  projectName,
}: DeploymentModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[680px] gap-0 p-0 sm:max-w-[680px]">
        <header className="flex items-stretch border-b border-secondary px-6">
          <DialogTitle className="sr-only">Deploy {projectName}</DialogTitle>
          <TabHeader
            active={initialTab === 'deploy'}
            icon={<Rocket className="h-4 w-4" />}
            subtitle="existing version"
            title="Deploy"
          />
          <TabHeader
            active={initialTab === 'promote'}
            disabled
            icon={<GitMerge className="h-4 w-4" />}
            subtitle="tag & release notes (Phase 2)"
            title="Promote"
          />
        </header>
        <div className="px-6 py-4">
          <DeployTab
            environments={environments}
            initialEnvSlug={initialEnvSlug}
            onClose={() => onOpenChange(false)}
            orgSlug={orgSlug}
            projectId={projectId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TabHeader({
  active,
  disabled,
  icon,
  subtitle,
  title,
}: {
  active: boolean
  disabled?: boolean
  icon: React.ReactNode
  subtitle: string
  title: string
}) {
  return (
    <div
      aria-disabled={disabled}
      className={cn(
        'flex flex-col py-4 pr-6 text-sm',
        active ? 'border-b-2 border-action -mb-px' : 'text-tertiary',
        disabled && 'opacity-50',
      )}
    >
      <span className="flex items-center gap-1.5 font-medium">
        {icon}
        {title}
      </span>
      <span className="mt-0.5 text-xs">{subtitle}</span>
    </div>
  )
}
