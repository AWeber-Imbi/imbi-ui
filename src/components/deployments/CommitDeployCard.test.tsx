import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import * as endpoints from '@/api/endpoints'
import { render } from '@/test/utils'
import type {
  CurrentReleaseEnvironment,
  DeploymentCommit,
  Environment,
} from '@/types'

import { CommitDeployCard } from './CommitDeployCard'
import type { PipelineStage } from './pipeline'
import type { DeploymentActions } from './useDeploymentActions'

// fallow-ignore-next-line unresolved-import
vi.mock('@/api/endpoints', async () => {
  const actual =
    await vi.importActual<typeof import('@/api/endpoints')>('@/api/endpoints')
  return {
    ...actual,
    listDeploymentRefs: vi.fn(),
    listRefCommits: vi.fn(),
    resolveDeploymentCommit: vi.fn(),
  }
})

const ENV = {
  id: 'testing',
  label_color: '#6B9A3F',
  name: 'Testing',
  slug: 'testing',
  sort_order: 1,
} as unknown as Environment

const commit = (sha: string, message: string): DeploymentCommit => ({
  author: 'kevin',
  ci_status: 'pass',
  is_head: false,
  message,
  sha,
  short_sha: sha.slice(0, 7),
})

const currentFor = (committish: string): CurrentReleaseEnvironment => ({
  ci_status: 'pass',
  current_status: 'success',
  environment: { name: 'testing', slug: 'testing' },
  external_run_url: null,
  last_event_at: '2026-06-01T00:00:00Z',
  release: {
    committish,
    created_at: '2026-06-01T00:00:00Z',
    created_by: 'gavin',
    id: 'rel-1',
    links: [],
    project_id: 'p1',
    tag: null,
    title: committish,
  },
})

const makeStage = (committish: string): PipelineStage => ({
  current: currentFor(committish),
  env: ENV,
  kind: 'commit',
  pendingReleases: [],
  rollbackTargets: [],
  upstream: null,
  upstreamCurrent: null,
})

const makeActions = (): DeploymentActions => ({
  deploy: vi.fn(),
  deployPending: false,
  deployPendingSha: null,
  promote: vi.fn(),
  promotePending: false,
})

const RECENT = [
  commit('aaa1111aaa1111', 'newest change'),
  commit('bbb2222bbb2222', 'middle change'),
  commit('ccc3333ccc3333', 'older change'),
]

const setup = (committish: string) => {
  vi.mocked(endpoints.listDeploymentRefs).mockResolvedValue([
    {
      is_default: true,
      kind: 'default',
      name: 'main',
      sha: 'aaa1111aaa1111',
    },
  ])
  vi.mocked(endpoints.listRefCommits).mockResolvedValue(RECENT)
  render(
    <CommitDeployCard
      accent={null}
      actions={makeActions()}
      canTrigger
      orgSlug="org"
      projectId="p1"
      stage={makeStage(committish)}
    />,
  )
}

describe('CommitDeployCard', () => {
  it('marks the deployed commit and splits Deploy/Roll back around it', async () => {
    setup('bbb2222bbb2222')
    await waitFor(() =>
      expect(screen.getByText('deployed')).toBeInTheDocument(),
    )
    expect(screen.getAllByRole('button', { name: /Deploy/ })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /Roll back/ })).toHaveLength(1)
    expect(endpoints.resolveDeploymentCommit).not.toHaveBeenCalled()
  })

  it('pins the deployed commit when it falls outside the recent window', async () => {
    vi.mocked(endpoints.resolveDeploymentCommit).mockResolvedValue(
      commit('ddd4444ddd4444', 'the running commit'),
    )
    setup('ddd4444ddd4444')
    await waitFor(() =>
      expect(screen.getByText('deployed')).toBeInTheDocument(),
    )
    expect(screen.getByText('the running commit')).toBeInTheDocument()
    expect(screen.getByText('… older commits not shown')).toBeInTheDocument()
    // Everything in the window is newer than the pinned current commit.
    expect(screen.getAllByRole('button', { name: /Deploy/ })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /Roll back/ })).toBeNull()
  })
})
