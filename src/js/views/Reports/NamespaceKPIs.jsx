import { Link, useSearchParams } from 'react-router-dom'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Context } from '../../state'
import { httpGet } from '../../utils'
import { Alert, Badge, ContentArea, Loading, Table } from '../../components'

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

function buildSortDefault(sort) {
  const value = {}
  const sortMatches = sort.match(
    /(?:(namespace|projects|stack_health_score|total_project_score|total_possible_project_score|percent_of_tpps) (asc|desc))/g
  )
  if (sortMatches !== null) {
    sortMatches.map((match) => {
      const [column, direction] = match.split(' ')
      value[column] = direction
    })
  }
  return value
}

function buildSearchParams(columnSortOrder, sortDirections) {
  const params = new URLSearchParams()
  const sortValues = columnSortOrder
    .filter((column) => sortDirections[column])
    .map((column) => `${column} ${sortDirections[column]}`)
  if (sortValues.length > 0) params.append('sort', sortValues.join(','))
  return params
}

function NamespaceKPIs() {
  const [globalState, dispatch] = useContext(Context)
  const [searchParams, setSearchParams] = useSearchParams()
  const columnSortOrder = [
    'namespace',
    'stack_health_score',
    'percent_of_tpps',
    'projects',
    'total_possible_project_score',
    'total_project_score'
  ]
  const [state, setState] = useState({
    data: [],
    lookup: {},
    fetched: false,
    errorMessage: null,
    sort: buildSortDefault(searchParams.get('sort') || '')
  })
  const { t } = useTranslation()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: t('reports.namespaceKPIs.title'),
        url: new URL('/ui/reports/namespace-kpis', globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    const sortBy = columnSortOrder
      .filter((column) => state.sort[column])
      .map((column) => ({ column: column, order: state.sort[column] }))
    const data = [...state.data].sort((a, b) => {
      for (let { column, order } of sortBy) {
        if (a[column] < b[column]) return order === 'asc' ? -1 : 1
        if (b[column] < a[column]) return order === 'asc' ? 1 : -1
      }
      return 0
    })
    setState({ ...state, data })
    setSearchParams(buildSearchParams(columnSortOrder, state.sort))
  }, [state.sort])

  useEffect(() => {
    if (state.fetched === false) {
      const url = new URL('/reports/namespace-kpis', globalState.baseURL)
      httpGet(
        globalState.fetch,
        url,
        (result) => {
          const lookup = Object.fromEntries(
            result.map((row) => [row.namespace, row.namespace_id])
          )
          setState({
            data: result,
            fetched: true,
            lookup: lookup,
            errorMessage: null,
            sort: state.sort
          })
        },
        (error) => {
          setState({
            data: [],
            fetched: true,
            lookup: {},
            errorMessage: error,
            sort: state.sort
          })
        }
      )
    }
  }, [state.fetched])

  function onSortDirection(column, direction) {
    const sort = { ...state.sort }
    if (direction === null) {
      if (sort[column] !== undefined) delete sort[column]
    } else if (state.sort[column] !== direction) {
      sort[column] = direction
    }
    if (state.sort !== sort) {
      setState({ ...state, sort: sort })
    }
  }

  const columns = [
    {
      title: t('terms.namespace'),
      name: 'namespace',
      sortCallback: onSortDirection,
      sortDirection: state.sort.namespace ? state.sort.namespace : null,
      type: 'text',
      tableOptions: {
        className: 'truncate',
        headerClassName: 'w-3/12',
        lookupFunction: (namespace) => {
          return (
            <Link to={`/ui/projects?namespace_id=${state.lookup[namespace]}`}>
              {namespace}
            </Link>
          )
        }
      }
    },
    {
      title: t('reports.namespaceKPIs.projects'),
      name: 'projects',
      sortCallback: onSortDirection,
      sortDirection: state.sort.projects ? state.sort.projects : null,
      type: 'text',
      tableOptions: {
        className: 'text-right',
        headerClassName: 'pl-2 text-right',
        lookupFunction: formatNumber
      }
    },
    {
      title: t('reports.namespaceKPIs.stackHealthScore'),
      name: 'stack_health_score',
      sortCallback: onSortDirection,
      sortDirection: state.sort.stack_health_score
        ? state.sort.stack_health_score
        : null,
      type: 'text',
      tableOptions: {
        className: 'text-center',
        headerClassName: 'pl-2 text-center',
        lookupFunction: colorizeValue
      }
    },
    {
      title: t('reports.namespaceKPIs.totalProjectScore'),
      name: 'total_project_score',
      sortCallback: onSortDirection,
      sortDirection: state.sort.total_project_score
        ? state.sort.total_project_score
        : null,
      type: 'text',
      tableOptions: {
        className: 'text-right',
        headerClassName: 'pl-2 text-right',
        lookupFunction: formatNumber
      }
    },
    {
      title: t('reports.namespaceKPIs.totalPossibleProjectScore'),
      name: 'total_possible_project_score',
      sortCallback: onSortDirection,
      sortDirection: state.sort.total_possible_project_score
        ? state.sort.total_possible_project_score
        : null,
      type: 'text',
      tableOptions: {
        className: 'text-right',
        headerClassName: 'pl-2 text-right',
        lookupFunction: formatNumber
      }
    },
    {
      title: t('reports.namespaceKPIs.totalProjectScorePercentage'),
      name: 'percent_of_tpps',
      sortCallback: onSortDirection,
      sortDirection: state.sort.percent_of_tpps
        ? state.sort.percent_of_tpps
        : null,
      type: 'text',
      tableOptions: {
        className: 'text-right',
        headerClassName: 'pl-2 text-right'
      }
    }
  ]

  if (state.errorMessage !== null)
    return <Alert level="error">{state.errorMessage}</Alert>
  if (state.fetched === false) return <Loading />
  return (
    <ContentArea
      className="flex-grow"
      pageIcon="fas chart-line"
      pageTitle="Namespace KPIs">
      <Table columns={columns} data={state.data} />
      <div className="italic text-gray-600 text-right text-xs">
        {t('reports.lastUpdated', { lastUpdated: new Date().toString() })}
      </div>
      <div className="ml-4 text-gray-600">
        <h1 className="font-medium my-2">Definitions</h1>
        <dl className="ml-2 text-sm">
          <dt className="font-medium">Stack Health Score</dt>
          <dd>
            The calculated score indicating the overall health of projects in
            the namespace
          </dd>
          <dt className="font-medium mt-2">Total Project Score</dt>
          <dd>
            The sum of the project scores for all projects in the namespace
          </dd>
          <dt className="font-medium mt-2">Total Possible Score</dt>
          <dd>
            The sum of the maximum possible project score for all projects in
            the namespace
          </dd>
          <dt className="font-medium mt-2">TPS %</dt>
          <dd>
            The Total Project Score percentage of the Total Possible Score
          </dd>
        </dl>
      </div>
    </ContentArea>
  )
}
export { NamespaceKPIs }
