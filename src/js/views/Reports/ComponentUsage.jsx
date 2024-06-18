import React from 'react'
import Report from '../../components/Report/Report'

function ComponentUsage() {
  return (
    <Report
      endpoint="/reports/component-usage"
      keyPrefix="reports.componentUsage"
      pageIcon="fas cubes"
      columns={[
        { name: 'name', type: 'text' },
        { name: 'package_url', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'active_version', type: 'text' },
        { name: 'version_count', type: 'number' },
        { name: 'project_count', type: 'number' }
      ]}
    />
  )
}

export { ComponentUsage }
