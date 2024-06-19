import { Link } from 'react-router-dom'
import React, { useContext } from 'react'

import { Context } from '../../state'
import { Badge } from '../../components'
import Report from '../../components/Report/Report'

function colorizeValue(value) {
  value = parseInt(value)
  let color = 'red'
  if (value === 0) color = 'gray'
  if (value > 69) color = 'yellow'
  if (value > 89) color = 'green'
  return (
    <Badge className="text-sm" color={color}>
      {value.toString()}
    </Badge>
  )
}

function formatNumber(value) {
  return value.toLocaleString()
}

function NamespaceKPIs() {
  const [globalState] = useContext(Context)
  const namespaceNameToSlug = new Map(
    globalState.metadata.namespaces.map((namespace) => [
      namespace.name,
      namespace.slug
    ])
  )

  return (
    <Report
      endpoint="/reports/namespace-kpis"
      keyPrefix="reports.namespaceKPIs"
      pageIcon="fas chart-line"
      columns={[
        {
          name: 'namespace',
          type: 'text',
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-3/12',
            lookupFunction: (namespace) => {
              const filter =
                'namespace_slug:' + namespaceNameToSlug.get(namespace)
              return (
                <Link to={`/ui/projects?f=${encodeURIComponent(filter)}`}>
                  {namespace}
                </Link>
              )
            }
          }
        },
        {
          name: 'projects',
          type: 'text',
          tableOptions: {
            className: 'text-right',
            headerClassName: 'pl-2 text-right',
            lookupFunction: formatNumber
          }
        },
        {
          name: 'stack_health_score',
          type: 'text',
          tableOptions: {
            className: 'text-center',
            headerClassName: 'pl-2 text-center',
            lookupFunction: colorizeValue
          }
        },
        {
          name: 'total_project_score',
          type: 'text',
          tableOptions: {
            className: 'text-right',
            headerClassName: 'pl-2 text-right',
            lookupFunction: formatNumber
          }
        },
        {
          name: 'total_possible_project_score',
          type: 'text',
          tableOptions: {
            className: 'text-right',
            headerClassName: 'pl-2 text-right',
            lookupFunction: formatNumber
          }
        },
        {
          name: 'percent_of_tpps',
          type: 'text',
          tableOptions: {
            className: 'text-right',
            headerClassName: 'pl-2 text-right'
          }
        }
      ]}
    />
  )
}
export { NamespaceKPIs }
