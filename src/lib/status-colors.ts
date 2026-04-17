export const STATUS_COLORS: Record<string, string> = {
  active:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  deprecated:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  evaluating:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  revoked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function statusBadgeClasses(status: string | undefined | null): string {
  return (status && STATUS_COLORS[status]) || STATUS_COLORS.inactive
}
