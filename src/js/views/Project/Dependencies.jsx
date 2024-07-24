import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Alert, Table } from '../../components'
import { httpGet, lookupNamespaceByID } from '../../utils'
import { useTranslation } from 'react-i18next'

function Dependencies({ project, urlPath }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [errorMessage, setErrorMessage] = useState()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'project.dependencies',
        url: new URL(`${urlPath}/dependencies`, globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    httpGet(
      globalState.fetch,
      new URL(
        `/projects/${project.id}/dependencies?include=dependency`,
        globalState.baseURL
      ),
      ({ data }) => {
        setRows(
          data
            .map(({ dependency }) => ({
              namespace: lookupNamespaceByID(
                globalState.metadata.namespaces,
                dependency.namespace_id
              ).name,
              name: dependency.name,
              project_type: lookupNamespaceByID(
                globalState.metadata.projectTypes,
                dependency.project_type_id
              ).name
            }))
            .sort((a, b) => {
              if (a.namespace < b.namespace) return -1
              else if (a.namespace > b.namespace) return 1
              else return a.name < b.name ? -1 : 1
            })
        )
      },
      ({ message }) => setErrorMessage(message)
    )
  }, [])

  const columns = [
    {
      title: t('terms.namespace'),
      name: 'namespace',
      type: 'text',
      tableOptions: {
        headerClassName: 'w-3/12',
        className: 'truncate'
      }
    },
    {
      title: t('terms.name'),
      name: 'name',
      type: 'text',
      tableOptions: {
        className: 'truncate',
        headerClassName: 'w-3/12'
      }
    },
    {
      title: t('terms.projectType'),
      name: 'project_type',
      type: 'text',
      tableOptions: {
        className: 'truncate',
        headerClassName: 'w-3/12'
      }
    }
  ]

  return (
    <>
      {errorMessage && (
        <Alert className="mt-3" level="error">
          {errorMessage}
        </Alert>
      )}
      <Table columns={columns} data={rows} />
    </>
  )
}
Dependencies.propTypes = {
  project: PropTypes.object.isRequired,
  urlPath: PropTypes.string.isRequired
}
export { Dependencies }
