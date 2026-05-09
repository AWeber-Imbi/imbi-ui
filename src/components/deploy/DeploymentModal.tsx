import { Rocket } from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Environment } from '@/types'

import { DeployTab } from './DeployTab'

interface DeploymentModalProps {
  environments: Environment[]
  initialEnvSlug?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  orgSlug: string
  projectId: string
  projectName: string
}

export function DeploymentModal({
  environments,
  initialEnvSlug,
  onOpenChange,
  open,
  orgSlug,
  projectId,
  projectName,
}: DeploymentModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[680px] gap-0 p-0 sm:max-w-[680px]">
        <header className="flex items-center gap-2 border-b border-secondary px-6 py-4">
          <Rocket className="text-action h-4 w-4" />
          <DialogTitle className="text-sm font-medium">
            Deploy {projectName}
          </DialogTitle>
          <span className="text-xs text-tertiary">— existing version</span>
        </header>
        <div className="px-6 py-4">
          <DeployTab
            environments={environments}
            initialEnvSlug={initialEnvSlug}
            onClose={() => onOpenChange(false)}
            open={open}
            orgSlug={orgSlug}
            projectId={projectId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
