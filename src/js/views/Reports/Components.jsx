import React, { useEffect, useState } from 'react'
import Report from '../../components/Report/Report'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '../../components/Form/Checkbox'

function createColumn(name, type, headerClassName, className) {
  const tableOptions = { headerClassName, className }
  return { name, type, tableOptions }
}

function Components() {
  const { t } = useTranslation()
  const packageSearchURL = ({ package_url }) => {
    const params = new URLSearchParams()
    params.append('f', `component_versions:"${package_url}"`)
    params.append('s', JSON.stringify({ name: 'asc' }))
    return `/ui/projects?${params.toString()}`
  }
  const [scoredOnly, setScoredOnly] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [reportData, setReportData] = useState([])
  const [displayedData, setDisplayedData] = useState([])
  useEffect(() => {
    let filteredRows = reportData
    if (scoredOnly) {
      filteredRows = filteredRows.filter(
        (row) => row.status !== 'Active' || row.active_version !== null
      )
    }
    if (filterText.length > 0) {
      const filterColumn = filterText.startsWith('pkg:')
        ? 'package_url'
        : 'name'
      filteredRows = filteredRows.filter((row) =>
        row[filterColumn].toLowerCase().includes(filterText.toLowerCase())
      )
    }
    setDisplayedData(filteredRows)
  }, [filterText, reportData, scoredOnly])

  function onFilterChange(event) {
    const value = event.target.value
    setFilterText(value)
  }

  return (
    <Report
      endpoint="/reports/component-usage"
      keyPrefix="reports.components"
      pageIcon="fas cubes"
      data={displayedData}
      rowURL={packageSearchURL}
      onDataLoaded={setReportData}
      onSortChange={(sortFunc) => {
        const nextData = [...reportData]
        setReportData(nextData.sort(sortFunc))
      }}
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
      ]}>
      <div className="relative flex items-stretch rounded-md flex-grow focus-within:z-10 gap-1">
        <input
          autoFocus={true}
          className="w-11/12 rounded-md shadow-sm pl-10 text-sm border-gray-300 focus:border-gray-300 focus:outline-0 focus:ring-0"
          onChange={onFilterChange}
          type="text"
          autoComplete="off"
          placeholder={t('common.filter')}
          style={{ padding: '.575rem' }}
          value={filterText}
        />
        <Checkbox
          name="scoredOnly"
          className="relative flex items-center flex-shrink-0 pl-2"
          onChange={(_, value) => setScoredOnly(value)}
          label={t('reports.components.labels.scoredOnly')}
          value={scoredOnly}
        />
      </div>
    </Report>
  )
}

export { Components }
