import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Context } from '../../state'
import { Alert, Loading, Table } from '../../components'
import { httpRequest, requestOptions } from '../../utils'
import { useTranslation } from 'react-i18next'
import { SlideOver } from '../../components/SlideOver/SlideOver'
import { ViewIdentifier } from './ViewIdentifier'

function IdentifierTable({ identifiers, projectId }) {
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

  const [viewSlideOverOpen, setViewSlideOverOpen] = useState(false)
  const [selectedIdentifier, setSelectedIdentifier] = useState(null)

  return (
    <>
      <Table
        columns={buildColumns()}
        data={identifiers}
        onRowClick={({ index }) => {
          setSelectedIdentifier(identifiers[index])
          setViewSlideOverOpen(true)
        }}
      />
      {selectedIdentifier !== null ? (
        <SlideOver
          open={viewSlideOverOpen}
          onClose={() => {
            setViewSlideOverOpen(false)
          }}
          title={
            <div>
              {t('project.identifiers.identifierTitle', {
                integrationName: selectedIdentifier.integration_name
              })}
            </div>
          }>
          <ViewIdentifier cachedIdentifier={selectedIdentifier} />
        </SlideOver>
      ) : (
        <></>
      )}
    </>
  )
}
IdentifierTable.propTypes = {
  projectId: PropTypes.number.isRequired,
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
    <IdentifierTable identifiers={identifiers} projectId={projectId} />
  )
}
Identifiers.propTypes = {
  project: PropTypes.object.isRequired
}

export { Identifiers }
