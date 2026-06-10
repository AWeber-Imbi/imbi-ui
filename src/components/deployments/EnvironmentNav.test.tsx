import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render } from '@/test/utils'
import type {
  CurrentReleaseEnvironment,
  Environment,
  ReleaseHistoryEntry,
} from '@/types'

import { EnvironmentNav } from './EnvironmentNav'
import type { PipelineStage } from './pipeline'

const env = (slug: string, name: string, sortOrder: number): Environment =>
  ({
    id: slug,
    label_color: '#5A89C9',
    name,
    slug,
    sort_order: sortOrder,
  }) as unknown as Environment

const current = (slug: string, tag: null | string, committish: string) =>
  ({
    ci_status: 'pass',
    current_status: 'success',
    environment: { name: slug, slug },
    external_run_url: null,
    last_event_at: '2026-06-01T00:00:00Z',
    release: {
      committish,
      created_at: '2026-06-01T00:00:00Z',
      created_by: 'gavin',
      id: `${slug}-rel`,
      links: [],
      project_id: 'p1',
      tag,
      title: tag ?? committish,
    },
  }) as CurrentReleaseEnvironment

const release = (tag: string): ReleaseHistoryEntry => ({
  ci_status: 'pass',
  sha: 'ccc333ccc333',
  short_sha: 'ccc333c',
  tag,
})

const STAGES: PipelineStage[] = [
  {
    current: current('testing', null, 'ddd444ddd444'),
    env: env('testing', 'Testing', 1),
    kind: 'commit',
    pendingReleases: [],
    rollbackTargets: [],
    upstream: null,
    upstreamCurrent: null,
  },
  {
    current: current('staging', 'v6.5.2', 'ccc333ccc333'),
    env: env('staging', 'Staging', 2),
    kind: 'promote',
    pendingReleases: [],
    rollbackTargets: [],
    upstream: env('testing', 'Testing', 1),
    upstreamCurrent: current('testing', null, 'ddd444ddd444'),
  },
  {
    current: current('production', 'v6.5.0', 'aaa111aaa111'),
    env: env('production', 'Production', 3),
    kind: 'release',
    pendingReleases: [release('v6.5.2'), release('v6.5.1')],
    rollbackTargets: [],
    upstream: env('staging', 'Staging', 2),
    upstreamCurrent: current('staging', 'v6.5.2', 'ccc333ccc333'),
  },
]

describe('EnvironmentNav', () => {
  it('renders environments in descending sort order', () => {
    render(
      <EnvironmentNav
        connectLabel="GitHub"
        isDarkMode={false}
        onSelect={() => {}}
        pendingCommitsBySlug={{}}
        readiness="connected"
        selectedSlug="staging"
        stages={STAGES}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual([
      expect.stringContaining('Production'),
      expect.stringContaining('Staging'),
      expect.stringContaining('Testing'),
    ])
  })

  it('badges pending releases and pending commits', () => {
    render(
      <EnvironmentNav
        connectLabel="GitHub"
        isDarkMode={false}
        onSelect={() => {}}
        pendingCommitsBySlug={{ staging: 8 }}
        readiness="connected"
        selectedSlug="staging"
        stages={STAGES}
      />,
    )
    // Production shows the newest pending release tag.
    expect(
      screen.getByTitle('Release v6.5.2 is waiting to deploy here'),
    ).toBeInTheDocument()
    // Staging shows the count of commits waiting to promote.
    expect(
      screen.getByTitle('8 commits waiting to promote here'),
    ).toBeInTheDocument()
    expect(screen.getByText('GitHub connected')).toBeInTheDocument()
  })

  it('invokes onSelect with the clicked environment slug', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <EnvironmentNav
        connectLabel="GitHub"
        isDarkMode={false}
        onSelect={onSelect}
        pendingCommitsBySlug={{}}
        readiness="connected"
        selectedSlug="staging"
        stages={STAGES}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Production/ }))
    expect(onSelect).toHaveBeenCalledWith('production')
  })

  it('shows the connect hint when disconnected', () => {
    render(
      <EnvironmentNav
        connectLabel="GitHub"
        isDarkMode={false}
        onSelect={() => {}}
        pendingCommitsBySlug={{}}
        readiness="disconnected"
        selectedSlug={null}
        stages={STAGES}
      />,
    )
    expect(
      screen.getByText('Connect to GitHub to enable deployments'),
    ).toBeInTheDocument()
  })
})
