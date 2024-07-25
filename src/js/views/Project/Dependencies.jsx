import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Alert, Icon, Table } from '../../components'
import { httpGet, httpPost, lookupNamespaceByID } from '../../utils'
import { useTranslation } from 'react-i18next'
import { ModalForm } from '../../components/Form/ModalForm'
import { jsonSchema } from '../../schema/ProjectDependencies'

function Dependencies({ project, urlPath }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [errorMessage, setErrorMessage] = useState()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'project.dependencies.title',
        url: new URL(`${urlPath}/dependencies`, globalState.baseURL)
      }
    })
  }, [])

  function updateDependencies() {
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
  }

  useEffect(() => {
    updateDependencies()
  }, [])

  const tableColumns = [
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

  const formColumns = [
    {
      title: t('terms.projectType'),
      name: 'id',
      type: 'number',
      omitOnAdd: true
    },
    {
      title: t('terms.projectType'),
      name: 'dependency_id',
      type: 'project'
    }
  ]

  async function onSubmitAdd(formValues) {
    const url = new URL(
      `/projects/${project.id}/dependencies`,
      globalState.baseURL
    )
    const result = await httpPost(globalState.fetch, url, formValues)
    if (result.success === true) {
      updateDependencies()
    } else {
      setErrorMessage(result.data)
    }
    setShowForm(false)
  }

  return (
    <>
      {errorMessage && (
        <Alert className="mt-3" level="error">
          {errorMessage}
        </Alert>
      )}
      <div className="text-right">
        <button
          className="btn-green"
          onClick={() => {
            setShowForm(true)
          }}>
          <Icon className="mr-2" icon="fas plus-circle" />
          {t('project.dependencies.add')}
        </button>
      </div>
      {showForm && (
        <ModalForm
          formType={'add'}
          columns={formColumns}
          onClose={() => setShowForm(false)}
          jsonSchema={jsonSchema}
          onSubmit={onSubmitAdd}
          savingTitle={t('admin.crud.savingTitle', {
            itemName: t('project.dependencies.title')
          })}
          title={t('project.dependencies.add')}
          values={{
            id: project.id,
            dependency_id: null
          }}
        />
      )}
      <Table columns={tableColumns} data={rows} />
    </>
  )
}

Dependencies.propTypes = {
  project: PropTypes.object.isRequired,
  urlPath: PropTypes.string.isRequired
}
export { Dependencies }
