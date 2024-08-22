import React from 'react'
import Report from '../../components/Report/Report'

function createColumn(name, type, headerClassName, className) {
  const tableOptions = { headerClassName, className }
  return { name, type, tableOptions }
}

function OutdatedProjects() {
  return (
    <Report
      endpoint="/reports/outdated-projects"
      keyPrefix="reports.outdatedProjects"
      pageIcon="fas cubes"
      rowURL={({ project_id }) => `/ui/projects/${project_id}/components`}
      columns={[
        createColumn('project_namespace', 'text', 'w-3/12', 'truncate'),
        createColumn('project_name', 'text', 'w-4/12', 'truncate'),
        createColumn(
          'component_score',
          'number',
          'w-2/12 text-center',
          'overflow-clip text-center'
        ),
        createColumn(
          'up_to_date',
          'number',
          'w-2/12 text-center',
          'overflow-clip text-center'
        ),
        createColumn(
          'deprecated',
          'number',
          'w-2/12 text-center',
          'overflow-clip text-center'
        ),
        createColumn(
          'outdated',
          'number',
          'w-2/12 text-center',
          'overflow-clip text-center'
        ),
        createColumn(
          'forbidden',
          'number',
          'w-2/12 text-center',
          'overflow-clip text-center'
        )
      ]}
    />
  )
}

export { OutdatedProjects }
