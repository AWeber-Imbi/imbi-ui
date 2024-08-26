import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fromKueryExpression,
  toElasticsearchQuery
} from '@cybernetex/kbn-es-query'
import { byString, byNumber, byValues } from 'sort-es'
import { useSearchParams } from 'react-router-dom'

import { Alert, ScoreBadge, Table } from '../../components'
import { Context } from '../../state'
import { httpPost } from '../../utils'
import { metadataAsOptions } from '../../settings'

import { Filter } from './Filter'
import { HelpDialog } from './HelpDialog'

const sortMap = {
  namespace: byString,
  name: byString,
  project_score: byNumber,
  project_type: byString
}

function sortTableData(data, columns) {
  const sortSettings = []
  for (const [column, direction] of Object.entries(columns)) {
    sortSettings.push([column, sortMap[column]({ desc: direction === 'desc' })])
  }
  return data.sort(byValues(sortSettings))
}

function Projects() {
  const [globalState, dispatch] = useContext(Context)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const [state, setState] = useState({
    columns: [],
    data: [],
    errorMessage: null,
    fetching: false,
    fields: ['id', 'namespace', 'project_type', 'name', 'project_score'],
    filter: searchParams.get('f') ? searchParams.get('f') : '',
    refresh: false,
    showHelp: false,
    sort: searchParams.get('s')
      ? JSON.parse(searchParams.get('s'))
      : {
          namespace: 'asc',
          name: 'asc'
        }
  })

  useEffect(() => {
    const url = new URL('/ui/projects', globalState.baseURL)
    url.search = searchParams.toString()
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        url: url,
        title: 'projects.title'
      }
    })
  }, [])

  function updateParams() {
    setSearchParams(
      new URLSearchParams({
        f: state.filter,
        s: JSON.stringify(state.sort)
      })
    )
  }

  function onRefresh() {
    setState({
      ...state,
      data: [],
      filter: searchParams.get('f') ? searchParams.get('f') : '',
      refresh: true
    })
  }

  function onSortChange(column, direction) {
    const sort = { ...state.sort }
    if (direction === null) {
      if (sort[column] !== undefined) delete sort[column]
    } else if (state.sort[column] !== direction) {
      sort[column] = direction
    }
    if (JSON.stringify(state.sort) !== JSON.stringify(sort)) {
      setState((prevState) => ({
        ...prevState,
        sort: sort
      }))
    }
  }

  function buildColumns() {
    return [
      {
        title: t('terms.namespace'),
        name: 'namespace',
        sortCallback: onSortChange,
        sortDirection:
          state.sort.namespace !== undefined ? state.sort.namespace : null,
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
        sortDirection: state.sort.name !== undefined ? state.sort.name : null,
        type: 'text',
        tableOptions: {
          className: 'truncate',
          headerClassName: 'w-3/12'
        }
      },
      {
        title: t('terms.projectType'),
        name: 'project_type',
        sortCallback: onSortChange,
        sortDirection:
          state.sort.project_type !== undefined
            ? state.sort.project_type
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
          state.sort.project_score !== undefined
            ? state.sort.project_score
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

  function buildURL(path) {
    return new URL(path, globalState.baseURL)
  }

  function search() {
    if (state.fetching === false) {
      let filter = state.filter
      if (filter.match(/^[^\s:]+$/)) filter = `*${state.filter}*`
      if (state.filter === '' || state.filter === '*')
        filter = 'NOT archived:true'
      else if (
        state.filter.length > 0 &&
        state.filter.includes('archived:') !== true
      )
        filter = `(${filter}) AND NOT archived:true`

      let ast

      try {
        ast = fromKueryExpression(filter)
      } catch (err) {
        setState((prevState) => ({
          ...prevState,
          errorMessage: err.shortMessage
        }))
        return
      }

      const query = {
        query: toElasticsearchQuery(ast, metadataAsOptions.openSearch),
        fields: state.fields,
        size: 1000
      }

      setState((prevState) => ({
        ...prevState,
        errorMessage: null,
        fetching: true
      }))

      httpPost(globalState.fetch, buildURL('/opensearch/projects'), query).then(
        ({ data, success }) => {
          if (success === true) {
            const tableData = []
            data.hits.hits.forEach((row) => {
              const values = {}
              for (const [key, value] of Object.entries(row.fields)) {
                values[key] = value[0]
              }
              tableData.push(values)
            })
            setState((prevState) => ({
              ...prevState,
              data: sortTableData(tableData, state.sort),
              errorMessage: null,
              fetching: false,
              refresh: false
            }))
          } else {
            setState((prevState) => ({
              ...prevState,
              errorMessage: t('projects.requestError', { error: data }),
              fetching: false,
              refresh: false
            }))
          }
        }
      )
    }
  }

  useEffect(() => {
    setState({ ...state, columns: buildColumns() })
  }, [state.fields])

  useEffect(() => {
    search()
  }, [state.fields, state.refresh])

  // Re-sort the table data when the sort settings change
  useEffect(() => {
    setState({
      ...state,
      columns: buildColumns(),
      data: sortTableData(state.data, state.sort)
    })
    updateParams()
  }, [state.sort])

  // Remove the error message after 30 seconds
  useEffect(() => {
    if (state.errorMessage !== null) {
      const timerHandle = setTimeout(() => {
        state.setErrorMessage(null)
      }, 30000)
      return () => {
        clearTimeout(timerHandle)
      }
    }
  }, [state.errorMessage])

  return (
    <div className="m-0 px-4 py-3 space-y-3">
      {state.errorMessage !== null && (
        <Alert className="mt-3" level="error">
          {state.errorMessage}
        </Alert>
      )}
      <div className="flex items-center space-x-2 md:space-x-10 w-100">
        <Filter
          disabled={state.fetching}
          onSubmit={() => {
            updateParams()
            search()
          }}
          onChange={(value) =>
            setState((prevState) => ({
              ...prevState,
              filter: value
            }))
          }
          onRefresh={onRefresh}
          onShowHelp={() => setState({ ...state, showHelp: true })}
          value={state.filter}
        />
      </div>
      <Table
        columns={state.columns}
        data={state.data}
        rowURL={(data) => `/ui/projects/${data.id}`}
      />
      {state.showHelp && (
        <HelpDialog
          title={t('projects.searchHelpTitle')}
          searchHelp={t('projects.searchHelp')}
          fields={Array.from(
            new Set(globalState.openSearch.fields.map((field) => field.name))
          )}
          onClose={() => setState({ ...state, showHelp: false })}
        />
      )}
    </div>
  )
}
export { Projects }
