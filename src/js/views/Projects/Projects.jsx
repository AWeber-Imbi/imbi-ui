import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fromKueryExpression,
  toElasticsearchQuery
} from '@cybernetex/kbn-es-query'
import { byString, byNumber, byValues } from 'sort-es'

import { Alert, ScoreBadge, Table } from '../../components'
import { Context } from '../../state'
import { httpPost } from '../../utils'

import { Filter } from './Filter'

import { metadataAsOptions } from '../../settings'

const sortMap = {
  namespace: byString,
  name: byString,
  project_score: byNumber,
  type: byString
}

function slugToName(items, slug) {
  let value = slug
  items.forEach((item) => {
    if (item.slug === slug) {
      value = item.name
    }
  })
  return value
}

function sortTableData(data, columns) {
  const sortSettings = []
  for (const [column, direction] of Object.entries(columns)) {
    sortSettings.push([column, sortMap[column]({ desc: direction === 'desc' })])
  }
  return data.sort(byValues(sortSettings))
}

function Projects() {
  const [errorMessage, setErrorMessage] = useState(null)
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()

  function buildURL(path) {
    return new URL(path, globalState.baseURL)
  }

  function onFilterChange(value) {
    if (value !== globalState.projects.filter) {
      setState({ ...state, data: [] })
      dispatch({
        type: 'SET_PROJECTS_FILTER',
        payload: value
      })
    }
  }

  function onRefresh() {
    setState({ ...state, data: [], refresh: true })
  }

  function onSortChange(column, direction) {
    const sort = { ...globalState.projects.sort }
    if (direction === null) {
      if (sort[column] !== undefined) delete sort[column]
    } else if (globalState.projects.sort[column] !== direction) {
      sort[column] = direction
    }
    if (JSON.stringify(globalState.projects.sort) !== JSON.stringify(sort)) {
      dispatch({
        type: 'SET_PROJECTS_SORT',
        payload: sort
      })
    }
  }

  function buildColumns() {
    return [
      {
        title: t('terms.namespace'),
        name: 'namespace',
        sortCallback: onSortChange,
        sortDirection:
          globalState.projects.sort.namespace !== undefined
            ? globalState.projects.sort.namespace
            : null,
        type: 'text',
        tableOptions: {
          className: 'truncate',
          headerClassName: 'w-3/12'
        }
      },
      {
        title: t('terms.name'),
        name: 'name',
        sortCallback: onSortChange,
        sortDirection:
          globalState.projects.sort.name !== undefined
            ? globalState.projects.sort.name
            : null,
        type: 'text',
        tableOptions: {
          className: 'truncate',
          headerClassName: 'w-3/12'
        }
      },
      {
        title: t('terms.projectType'),
        name: 'type',
        sortCallback: onSortChange,
        sortDirection:
          globalState.projects.sort.type !== undefined
            ? globalState.projects.sort.type
            : null,
        type: 'text',
        tableOptions: {
          className: 'truncate',
          headerClassName: 'w-3/12'
        }
      },
      {
        title: t('terms.healthScore'),
        name: 'project_score',
        sortCallback: onSortChange,
        sortDirection:
          globalState.projects.sort.project_score !== undefined
            ? globalState.projects.sort.project_score
            : null,
        type: 'text',
        tableOptions: {
          className: 'text-center',
          headerClassName: 'w-2/12 text-center',
          lookupFunction: (value) => {
            return <ScoreBadge value={value} />
          }
        }
      }
    ]
  }

  const slugToNameMap = {
    namespace: globalState.metadata.namespaces,
    type: globalState.metadata.projectTypes
  }

  const [state, setState] = useState({
    columns: buildColumns(),
    data: [],
    fetching: false,
    refresh: false
  })

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        url: buildURL('/ui/projects'),
        title: 'projects.title'
      }
    })
  }, [])

  useEffect(() => {
    if (state.fetching === false) {
      setState({ ...state, fetching: true })

      let filter = globalState.projects.filter
      if (
        globalState.projects.filter === '' ||
        globalState.projects.filter === '*'
      )
        filter = 'NOT archived:true'
      else if (
        globalState.projects.filter.length > 0 &&
        globalState.projects.filter.includes('archived:') !== true
      )
        filter = `(${globalState.projects.filter}) AND NOT archived:true`

      const query = {
        query: toElasticsearchQuery(
          fromKueryExpression(filter),
          metadataAsOptions.openSearch
        ),
        fields: globalState.projects.fields,
        size: 1000
      }

      httpPost(globalState.fetch, buildURL('/opensearch/projects'), query).then(
        ({ data, success }) => {
          if (success === true) {
            const tableData = []
            data.hits.hits.forEach((row) => {
              const values = {}
              for (const [key, value] of Object.entries(row.fields)) {
                if (slugToNameMap[key] !== undefined) {
                  values[key] = slugToName(slugToNameMap[key], value[0])
                } else {
                  values[key] = value[0]
                }
              }
              tableData.push(values)
            })
            onTableData(tableData)
          } else {
            onRequestError(data)
          }
        }
      )
    }
  }, [globalState.projects.fields, globalState.projects.filter, state.refresh])

  function onTableData(data) {
    setState({
      ...state,
      data: sortTableData(data, globalState.projects.sort),
      fetching: false,
      refresh: false
    })
  }

  function onRequestError(data) {
    setErrorMessage(t('projects.requestError', { error: data }))
    setState({
      ...state,
      fetching: false,
      refresh: false
    })
  }

  // Re-sort the table data when the sort settings change
  useEffect(() => {
    setState({
      ...state,
      columns: buildColumns(),
      data: sortTableData(state.data, globalState.projects.sort)
    })
  }, [globalState.projects.sort])

  // Remove the error message after 30 seconds
  useEffect(() => {
    if (errorMessage !== null) {
      const timerHandle = setTimeout(() => {
        setErrorMessage(null)
      }, 30000)
      return () => {
        clearTimeout(timerHandle)
      }
    }
  }, [errorMessage])

  return (
    <div className="m-0 px-4 py-3 space-y-3">
      {errorMessage !== null && (
        <Alert className="mt-3" level="error">
          {errorMessage}
        </Alert>
      )}
      <div className="flex items-center space-x-2 md:space-x-10 w-100">
        <Filter
          disabled={state.fetching}
          onChange={onFilterChange}
          onRefresh={onRefresh}
          value={globalState.projects.filter}
        />
      </div>
      <Table
        columns={state.columns}
        data={state.data}
        rowURL={(data) => `/ui/projects/${data.id}`}
      />
    </div>
  )
}
export { Projects }
