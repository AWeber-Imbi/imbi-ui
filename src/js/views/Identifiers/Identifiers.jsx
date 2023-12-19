import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Context } from '../../state'
import { Alert, Loading, Table } from '../../components'
import { httpRequest, requestOptions } from '../../utils'
import { useTranslation } from 'react-i18next'

function IdentifierTable({ identifiers }) {
  const { t } = useTranslation()

  function buildColumns() {
    return [
      {
        title: t('project.identifiers.columns.owner'),
        name: 'integration_name',
        type: 'text'
      },
      {
        title: t('project.identifiers.columns.externalId'),
        name: 'external_id',
        type: 'text'
      }
    ]
  }

  return <Table columns={buildColumns()} data={identifiers} />
}
IdentifierTable.propTypes = {
  identifiers: PropTypes.arrayOf(PropTypes.object).isRequired
}

function Identifiers({ project }) {
  const [globalState] = useContext(Context)
  const projectId = project.id
  const [identifiers, setIdentifiers] = useState(null)
  const [errorMessage, setErrorMessage] = useState()

  useEffect(() => {
    if (identifiers === null) {
      httpRequest(
        globalState.fetch,
        new URL(`/projects/${projectId}/identifiers`, globalState.baseURL),
        requestOptions
      ).then(({ data, success }) => {
        if (success) {
          setIdentifiers(data)
        } else {
          setErrorMessage(data.toString())
        }
      })
    }
  }, [projectId])

  return errorMessage ? (
    <Alert className="mt-3" level="error">
      {errorMessage}
    </Alert>
  ) : identifiers === null ? (
    <Loading />
  ) : (
    <IdentifierTable identifiers={identifiers} />
  )
}
Identifiers.propTypes = {
  project: PropTypes.object.isRequired
}

export { Identifiers }
