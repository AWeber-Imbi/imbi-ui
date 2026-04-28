import { useQuery } from '@tanstack/react-query'
import { listOperationsLog } from '@/api/endpoints'

export function useRecentDeployments(orgSlug: string, limit = 50) {
  return useQuery({
    queryKey: ['recentDeployments', orgSlug, limit],
    enabled: Boolean(orgSlug),
    queryFn: async ({ signal }) => {
      const page = await listOperationsLog(
        { limit, filters: { entry_type: 'Deployed' } },
        signal,
      )
      return page.entries
    },
  })
}
