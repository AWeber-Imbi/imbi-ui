import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Filter } from '../Projects/Filter'
import { Alert } from '../../components'
import {
  fromKueryExpression,
  toElasticsearchQuery
} from '@cybernetex/kbn-es-query'
import { metadataAsOptions } from '../../settings'
import { httpPost } from '../../utils'
import { useTranslation } from 'react-i18next'
import { HelpDialog } from '../Projects/HelpDialog'
import { useSearchParams } from 'react-router-dom'
import { ViewOperationsLog } from './ViewOperationsLog'
import PropTypes from 'prop-types'
import { NavigableTable } from '../../components/Table'

function cloneParams(searchParams) {
  const newParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    newParams.set(key, value)
  }
  return newParams
}

function OperationsLog({ projectID, urlPath, className }) {
  const [globalState, dispatch] = useContext(Context)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState(
    searchParams.get('f') ? searchParams.get('f') : ''
  )
  const [onFetch, setOnFetch] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [updated, setUpdated] = useState(null)
  const [deletedID, setDeletedID] = useState()
  const [rows, setRows] = useState([])
  const [errorMessage, setErrorMessage] = useState()
  const [showHelp, setShowHelp] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState()
  const { t } = useTranslation()

  if (deletedID) {
    setRows((prevRows) => prevRows.filter((r) => r.id !== deletedID))
    setDeletedID(null)
  }
  if (updated !== null) {
    setRows((prevRows) =>
      prevRows.map((r) => (r.id === updated.id ? updated : r))
    )
    setUpdated(null)
  }

  useEffect(() => {
    const path = urlPath ? `${urlPath}/operations-log` : 'ui/operations-log'
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'operationsLog.title',
        url: new URL(path, globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    const selectedId = searchParams.get('v')
    if (rows && selectedId) {
      const index = rows.findIndex((r) => r.id.toString() === selectedId)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [rows, setSelectedIndex])

  useEffect(() => {
    if (fetching || !onFetch) return
    setFetching(true)

    let query = filter.trim()
    if (projectID) {
      query += query
        ? ` AND project_id:${projectID}`
        : `project_id:${projectID}`
    }

    const payload = {
      query: toElasticsearchQuery(
        fromKueryExpression(query),
        metadataAsOptions.openSearch
      ),
      sort: [{ occurred_at: { order: 'desc' } }],
      fields: globalState.fields,
      size: 1000
    }

    httpPost(
      globalState.fetch,
      new URL('/opensearch/operations-log', globalState.baseURL),
      payload
    ).then(({ data, success }) => {
      if (success) {
        setErrorMessage(null)
        setRows(
          data.hits.hits
            .map((hit) => hit._source)
            .filter((r) => r.id !== deletedID)
        )
        setDeletedID(null)
      } else {
        setErrorMessage(t('operationsLog.requestError', { error: data }))
      }
      setFetching(false)
      setOnFetch(false)
    })
  }, [onFetch])

  function buildColumns() {
    const columns = [
      {
        title: t('operationsLog.occurredAt'),
        name: 'occurred_at',
        type: 'datetime',
        tableOptions: {
          headerClassName: 'w-2/12 truncate',
          className: 'truncate'
        }
      },
      {
        title: t('operationsLog.environment'),
        name: 'environment',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12'
        }
      }
    ]

    if (!projectID) {
      columns.push({
        title: t('operationsLog.project'),
        name: 'project_name',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12',
          className: 'truncate'
        }
      })
    }

    return columns.concat([
      {
        title: t('operationsLog.changeType'),
        name: 'change_type',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12 truncate'
        }
      },
      {
        title: t('operationsLog.description'),
        name: 'description',
        type: 'text',
        tableOptions: {
          className: 'truncate'
        }
      },
      {
        title: t('operationsLog.performedBy'),
        name: 'display_name',
        type: 'text',
        tableOptions: {
          headerClassName: 'w-2/12 truncate',
          className: 'truncate'
        }
      }
    ])
  }

  return (
    <div className={`m-0 space-y-3 ${className}`}>
      {errorMessage && (
        <Alert className="mt-3" level="error">
          {errorMessage}
        </Alert>
      )}
      <Filter
        disabled={fetching}
        onChange={(value) => setFilter(value)}
        onSubmit={() => {
          setSearchParams(new URLSearchParams({ f: filter }))
          setOnFetch(true)
        }}
        onRefresh={() => {
          setFilter(searchParams.get('f') ? searchParams.get('f') : '')
          setOnFetch(true)
        }}
        onShowHelp={() => setShowHelp(true)}
        value={filter}
      />
      <NavigableTable
        title={t('operationsLog.entry')}
        columns={buildColumns()}
        data={rows}
        extractSearchParam={(row) => row.id.toString()}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        defaultSort="occurred_at"
        defaultSortDirection="desc"
        onSortChange={(sorter) => {
          setRows((prevRows) => [...prevRows].sort(sorter))
        }}
        slideOverElement={
          <ViewOperationsLog
            cachedEntry={rows[selectedIndex]}
            operationsLogID={parseInt(searchParams.get('v'))}
            onDelete={(operationsLogID) => {
              const newParams = cloneParams(searchParams)
              newParams.delete('v')
              setSearchParams(newParams)
              setDeletedID(operationsLogID)
            }}
            onDeleteOpen={() => {}}
            onDeleteClose={() => {}}
            onEditOpen={() => {}}
            onEditClose={() => {}}
            onUpdate={(entry) => {
              setUpdated(entry)
            }}
          />
        }
      />

      {showHelp && (
        <HelpDialog
          onClose={() => setShowHelp(false)}
          title={t('operationsLog.searchHelpTitle')}
          searchHelp={t('operationsLog.searchHelp')}
          fields={[
            'change_type',
            'completed_at',
            'description',
            'display_name',
            'environment',
            'id',
            'link',
            'notes',
            'occurred_at',
            'performed_by',
            'project_id',
            'project_name',
            'recorded_at',
            'recorded_by',
            'ticket_slug',
            'version'
          ]}
        />
      )}
    </div>
  )
}
OperationsLog.propTypes = {
  projectID: PropTypes.number,
  urlPath: PropTypes.string,
  className: PropTypes.string
}
export { OperationsLog }
