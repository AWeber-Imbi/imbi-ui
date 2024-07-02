import React from 'react'
import Report from '../../components/Report/Report'

function createColumn(name, type, headerClassName, className) {
  const tableOptions = { headerClassName, className }
  return { name, type, tableOptions }
}

function ComponentUsage() {
  return (
    <Report
      endpoint="/reports/component-usage"
      keyPrefix="reports.componentUsage"
      pageIcon="fas cubes"
      columns={[
        createColumn('name', 'text', 'w-3/12', 'truncate'),
        createColumn('package_url', 'text', 'w-4/12', 'truncate'),
        createColumn('status', 'text', 'w-1/12', 'overflow-clip'),
        createColumn('active_version', 'text', 'w-2/12', 'overflow-clip'),
        createColumn('version_count', 'number', 'w-1/12'),
        createColumn('project_count', 'number', 'w-1/12')
      ]}
    />
  )
}

export { ComponentUsage }
