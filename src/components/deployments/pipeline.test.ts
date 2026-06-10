import { describe, expect, it } from 'vitest'

import type {
  CurrentReleaseEnvironment,
  Environment,
  ReleaseHistoryEntry,
} from '@/types'

import { buildPipeline, defaultStageSlug } from './pipeline'

const env = (slug: string, sortOrder: number): Environment =>
  ({
    can_deploy: true,
    can_promote: false,
    id: slug,
    label_color: '#5A89C9',
    name: slug[0].toUpperCase() + slug.slice(1),
    slug,
    sort_order: sortOrder,
  }) as unknown as Environment

const currentRelease = (
  slug: string,
  committish: string,
  tag: null | string,
): CurrentReleaseEnvironment => ({
  ci_status: 'pass',
  current_status: 'success',
  environment: { name: slug, slug },
  external_run_url: null,
  last_event_at: '2026-06-01T00:00:00Z',
  release: {
    committish,
    created_at: '2026-06-01T00:00:00Z',
    created_by: 'gavin',
    id: `${slug}-release`,
    links: [],
    project_id: 'p1',
    tag,
    title: tag ?? committish,
  },
})

const entry = (tag: string, sha: string): ReleaseHistoryEntry => ({
  ci_status: 'pass',
  notes_markdown: `notes for ${tag}`,
  published_at: '2026-06-01T00:00:00Z',
  sha,
  short_sha: sha.slice(0, 7),
  tag,
})

const ENVS = [env('testing', 1), env('staging', 2), env('production', 3)]

// Newest (highest semver) first, mirroring /deployments/release-history.
const HISTORY = [
  entry('v6.5.2', 'ccc333ccc333'),
  entry('v6.5.1', 'bbb222bbb222'),
  entry('v6.5.0', 'aaa111aaa111'),
  entry('v6.4.0', '000999000999'),
]

const CURRENT = [
  currentRelease('testing', 'ddd444ddd444', null),
  currentRelease('staging', 'ccc333ccc333', 'v6.5.2'),
  currentRelease('production', 'aaa111aaa111', 'v6.5.0'),
]

describe('buildPipeline', () => {
  const stages = buildPipeline(ENVS, CURRENT, HISTORY)

  it('derives stage kinds from upstream data, not position names', () => {
    expect(stages.map((s) => s.kind)).toEqual(['commit', 'promote', 'release'])
  })

  it('computes pending releases between the env and its upstream', () => {
    const production = stages[2]
    expect(production.pendingReleases.map((r) => r.tag)).toEqual([
      'v6.5.2',
      'v6.5.1',
    ])
  })

  it('treats an env with no release as pending everything up to upstream', () => {
    const noProd = CURRENT.filter((c) => c.environment.slug !== 'production')
    const result = buildPipeline(ENVS, noProd, HISTORY)
    expect(result[2].pendingReleases.map((r) => r.tag)).toEqual([
      'v6.5.2',
      'v6.5.1',
      'v6.5.0',
      'v6.4.0',
    ])
  })

  it('returns no pending releases when the env matches its upstream', () => {
    const synced = [
      currentRelease('testing', 'ddd444ddd444', null),
      currentRelease('staging', 'ccc333ccc333', 'v6.5.2'),
      currentRelease('production', 'ccc333ccc333', 'v6.5.2'),
    ]
    const result = buildPipeline(ENVS, synced, HISTORY)
    expect(result[2].pendingReleases).toEqual([])
  })

  it('returns no pending releases when the env is ahead of its upstream', () => {
    const ahead = [
      currentRelease('testing', 'ddd444ddd444', null),
      currentRelease('staging', 'aaa111aaa111', 'v6.5.0'),
      currentRelease('production', 'ccc333ccc333', 'v6.5.2'),
    ]
    const result = buildPipeline(ENVS, ahead, HISTORY)
    expect(result[2].pendingReleases).toEqual([])
  })

  it('collects rollback targets older than the current tag', () => {
    const production = stages[2]
    expect(production.rollbackTargets.map((r) => r.tag)).toEqual(['v6.4.0'])
    const staging = stages[1]
    expect(staging.rollbackTargets.map((r) => r.tag)).toEqual([
      'v6.5.1',
      'v6.5.0',
      'v6.4.0',
    ])
  })

  it('treats a tagged upstream as release-kind even mid-train', () => {
    // Four-stage train: the third and fourth envs both sit below tagged
    // upstreams, so both are release-kind.
    const envs = [...ENVS, env('dr', 4)]
    const current = [...CURRENT, currentRelease('dr', '000999000999', 'v6.4.0')]
    const result = buildPipeline(envs, current, HISTORY)
    expect(result[3].kind).toBe('release')
    expect(result[3].pendingReleases.map((r) => r.tag)).toEqual(['v6.5.0'])
  })
})

describe('defaultStageSlug', () => {
  it('selects the earliest stage with pending work', () => {
    const stages = buildPipeline(ENVS, CURRENT, HISTORY)
    expect(defaultStageSlug(stages, { staging: 3 })).toBe('staging')
    expect(defaultStageSlug(stages, { staging: 0 })).toBe('production')
  })

  it('falls back to the first environment when nothing is pending', () => {
    const synced = [
      currentRelease('testing', 'ccc333ccc333', null),
      currentRelease('staging', 'ccc333ccc333', 'v6.5.2'),
      currentRelease('production', 'ccc333ccc333', 'v6.5.2'),
    ]
    const stages = buildPipeline(ENVS, synced, HISTORY)
    expect(defaultStageSlug(stages, { staging: 0 })).toBe('testing')
  })
})
