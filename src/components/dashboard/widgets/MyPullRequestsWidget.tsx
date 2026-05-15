import { useQuery } from '@tanstack/react-query'

import { getMyIdentities, getOrgPullRequests } from '@/api/endpoints'
import { useOrganization } from '@/contexts/OrganizationContext'
import type { IdentityConnectionResponse } from '@/types'

const GITHUB_PR_PLUGIN_SLUG = 'github-enterprise-cloud'

// fallow-ignore-next-line complexity
export function MyPullRequestsWidget() {
  const { selectedOrganization } = useOrganization()
  const orgSlug = selectedOrganization?.slug ?? ''

  const { data: identities, isLoading: identitiesLoading } = useQuery({
    queryFn: ({ signal }) => getMyIdentities(signal),
    queryKey: ['me-identities'],
    staleTime: 0,
  })

  const login = identities ? githubLogin(identities) : undefined
  const hasIdentity = !identitiesLoading && !!login

  const { data: openData, isLoading: openLoading } = useQuery({
    enabled: hasIdentity && !!orgSlug,
    queryFn: ({ signal }) =>
      getOrgPullRequests(
        orgSlug,
        { author: login, limit: 1, state: 'open' },
        signal,
      ),
    queryKey: ['my-prs', orgSlug, login, 'open'],
    staleTime: 60 * 1000,
  })

  const { data: closedData, isLoading: closedLoading } = useQuery({
    enabled: hasIdentity && !!orgSlug,
    queryFn: ({ signal }) =>
      getOrgPullRequests(
        orgSlug,
        { author: login, limit: 1, state: 'closed' },
        signal,
      ),
    queryKey: ['my-prs', orgSlug, login, 'closed'],
    staleTime: 60 * 1000,
  })

  const isLoading = identitiesLoading || openLoading || closedLoading
  const notConnected = !identitiesLoading && !login

  return (
    <div className="border-border bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-sm">My Pull Requests</p>
          {isLoading ? (
            <span
              aria-label="Loading My Pull Requests"
              className="bg-tertiary/40 mt-2 inline-block h-8 w-20 animate-pulse rounded"
              role="status"
            />
          ) : notConnected ? (
            <>
              <p className="text-tertiary mt-2 text-3xl">—</p>
              <a
                className="text-action mt-1 block text-xs hover:underline"
                href="/settings/connections"
              >
                Connect GitHub
              </a>
            </>
          ) : (
            <>
              <p className="text-action mt-2 text-3xl">
                {openData?.total ?? 0}
              </p>
              <p className="text-tertiary mt-1 text-xs">
                {closedData?.total ?? 0} closed
              </p>
            </>
          )}
        </div>
        <div className="text-4xl">🔀</div>
      </div>
    </div>
  )
}

function githubLogin(
  identities: IdentityConnectionResponse[],
): string | undefined {
  return identities.find((i) => i.plugin_slug === GITHUB_PR_PLUGIN_SLUG)
    ?.subject
}
