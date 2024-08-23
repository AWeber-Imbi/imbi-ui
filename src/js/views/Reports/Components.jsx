import React from 'react'
import Report from '../../components/Report/Report'

function createColumn(name, type, headerClassName, className) {
  const tableOptions = { headerClassName, className }
  return { name, type, tableOptions }
}

function Components() {
  const packageSearchURL = ({ package_url }) => {
    const params = new URLSearchParams()
    params.append('f', `component_versions:"${package_url}"`)
    params.append('s', JSON.stringify({ name: 'asc' }))
    return `/ui/projects?${params.toString()}`
  }
  return (
    <Report
      endpoint="/reports/component-usage"
      keyPrefix="reports.components"
      pageIcon="fas cubes"
      rowURL={packageSearchURL}
      columns={[
        createColumn('name', 'text', 'w-3/12', 'truncate'),
        createColumn('package_url', 'text', 'w-4/12', 'truncate'),
        createColumn('status', 'text', 'w-1/12', 'overflow-clip'),
        createColumn(
          'active_version',
          'text',
          'w-2/12 text-center',
          'overflow-clip text-center'
        ),
        createColumn(
          'project_count',
          'number',
          'w-2/12 text-center',
          'text-center'
        )
      ]}
    />
  )
}

export { Components }
