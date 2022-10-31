import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Filter } from '../Projects/Filter'
import { Alert, Table } from '../../components'
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
import { SlideOver } from '../../components/SlideOver/SlideOver'

function cloneParams(searchParams) {
  const newParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    newParams.set(key, value)
  }
  return newParams
}

function OperationsLog() {
  const [globalState, dispatch] = useContext(Context)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState(
    searchParams.get('f') ? searchParams.get('f') : ''
  )
  const [onFetch, setOnFetch] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [deletedID, setDeletedID] = useState()
  const [rows, setRows] = useState([])
  const [errorMessage, setErrorMessage] = useState()
  const [showHelp, setShowHelp] = useState(false)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const { t } = useTranslation()

  if (searchParams.get('v') && !slideOverOpen) {
    setSlideOverOpen(true)
  } else if (!searchParams.get('v') && slideOverOpen) {
    setSlideOverOpen(false)
  }

  if (deletedID) {
    setRows((prevRows) => prevRows.filter((r) => r.id !== deletedID))
    setDeletedID(null)
  }

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'operationsLog.title',
        url: new URL('/ui/operations-log', globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    if (fetching || !onFetch) return
    setFetching(true)

    const query = {
      query: toElasticsearchQuery(
        fromKueryExpression(filter),
        metadataAsOptions.openSearch
      ),
      sort: [{ recorded_at: { order: 'desc' } }],
      fields: globalState.fields,
      size: 1000
    }

    httpPost(
      globalState.fetch,
      buildURL('/opensearch/operations-log'),
      query
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
        setErrorMessage(t('projects.requestError', { error: data }))
      }
      setFetching(false)
      setOnFetch(false)
    })
  }, [onFetch])

  function buildURL(path) {
    return new URL(path, globalState.baseURL)
  }

  const columns = [
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
      title: t('operationsLog.project'),
      name: 'project_name',
      type: 'text',
      tableOptions: {
        headerClassName: 'w-2/12',
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
    },
    {
      title: t('operationsLog.recordedBy'),
      name: 'recorded_by',
      type: 'text',
      tableOptions: {
        headerClassName: 'w-2/12 truncate',
        className: 'truncate'
      }
    },
    {
      title: t('operationsLog.recordedAt'),
      name: 'recorded_at',
      type: 'datetime',
      tableOptions: {
        headerClassName: 'w-2/12 truncate',
        className: 'truncate'
      }
    }
  ]

  return (
    <div className="m-0 px-4 py-3 space-y-3 grow">
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
      <Table
        columns={columns}
        data={rows}
        onRowClick={(data) => {
          const newParams = cloneParams(searchParams)
          newParams.set('v', data.id)
          setSearchParams(newParams)
          setSlideOverOpen(true)
        }}
        checkIsHighlighted={(row) => row.id === parseInt(searchParams.get('v'))}
      />
      <SlideOver
        open={slideOverOpen}
        title={t('operationsLog.entry')}
        onClose={() => {
          const newParams = cloneParams(searchParams)
          newParams.delete('v')
          setSearchParams(newParams)
          if (updated) {
            setOnFetch(true)
            setUpdated(false)
          }
          setSlideOverOpen(false)
        }}>
        <ViewOperationsLog
          operationsLogID={parseInt(searchParams.get('v'))}
          onUpdate={() => setUpdated(true)}
          onDelete={(operationsLogID) => {
            const newParams = cloneParams(searchParams)
            newParams.delete('v')
            setSearchParams(newParams)
            setDeletedID(operationsLogID)
          }}
        />
      </SlideOver>

      {showHelp && (
        <HelpDialog
          onClose={() => setShowHelp(false)}
          title={t('operationsLog.searchHelpTitle')}
          searchHelp={t('operationsLog.searchHelp')}
          fields={[
            'change_type',
            'description',
            'project_id',
            'project_name',
            'environment',
            'recorded_by',
            'recorded_at',
            'link',
            'notes',
            'version'
          ]}
        />
      )}
    </div>
  )
}
export { OperationsLog }
