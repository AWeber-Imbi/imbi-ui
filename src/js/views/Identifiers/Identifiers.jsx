import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Context } from '../../state'
import { Alert, Button, Icon, Loading, Table } from '../../components'
import { httpRequest, requestOptions } from '../../utils'
import { Trans, useTranslation } from 'react-i18next'
import { SlideOver } from '../../components/SlideOver/SlideOver'
import { ViewIdentifier } from './ViewIdentifier'
import { NewIdentifier } from './NewIdentifier'

function IdentifierTable({ integrations, identifiers, projectId, onChange }) {
  const { t, i18n } = useTranslation()

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

  const [addSlideOverOpen, setAddSlideOverOpen] = useState(false)
  const [viewSlideOverOpen, setViewSlideOverOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [availableIntegrations, setAvailableIntegrations] =
    useState(integrations)

  function addIdentifier() {
    setAddSlideOverOpen(true)
  }

  function onIdentifierModified() {
    setViewSlideOverOpen(false)
    setSelectedIndex(null)
    onChange()
  }

  useEffect(() => {
    const inUse = new Set(identifiers.map((elm) => elm.integration_name))
    const available = integrations.filter((name) => !inUse.has(name))
    setAvailableIntegrations(available)
  }, [identifiers, integrations])

  return (
    <>
      {identifiers.length > 0 ? (
        <Table
          columns={buildColumns()}
          data={identifiers}
          onRowClick={({ index }) => {
            setSelectedIndex(index)
            setViewSlideOverOpen(true)
          }}
        />
      ) : (
        <></>
      )}
      <SlideOver
        title={t('project.identifiers.newIdentifier')}
        open={addSlideOverOpen}
        onClose={() => setAddSlideOverOpen(false)}>
        <NewIdentifier
          integrations={availableIntegrations}
          projectId={projectId}
          onSuccess={() => {
            setAddSlideOverOpen(false)
            onChange()
          }}
          onCancel={() => setAddSlideOverOpen(false)}
        />
      </SlideOver>
      {selectedIndex !== null ? (
        <SlideOver
          open={viewSlideOverOpen}
          onClose={() => {
            setViewSlideOverOpen(false)
          }}
          title={
            <Trans
              i18nKey="project.identifiers.identifierTitle"
              i18n={i18n}
              t={t}>
              <span>
                {{
                  integrationName: identifiers[selectedIndex].integration_name
                }}
              </span>
            </Trans>
          }>
          <ViewIdentifier
            cachedIdentifier={identifiers[selectedIndex]}
            integrations={availableIntegrations.concat(
              identifiers[selectedIndex].integration_name
            )}
            onDelete={onIdentifierModified}
            onUpdate={onIdentifierModified}
          />
        </SlideOver>
      ) : (
        <></>
      )}
      {availableIntegrations.length > 0 ? (
        <div className="flex-grow flex flex-row items-end">
          <div className="flex-grow text-right">
            <Button
              className="text-xs mt-1 right btn-white"
              onClick={() => {
                addIdentifier()
              }}>
              <Icon icon="fas edit" className="mr-2" />
              {t('project.identifiers.addIdentifier')}
            </Button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}
IdentifierTable.propTypes = {
  integrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  projectId: PropTypes.number.isRequired,
  identifiers: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired
}

function Identifiers({ project, setIntegrationCount }) {
  const [globalState] = useContext(Context)
  const projectId = project.id
  const [identifiers, setIdentifiers] = useState(null)
  const [errorMessage, setErrorMessage] = useState()
  const [fetchIdentifiers, setFetchIdentifiers] = useState()
  const [integrations, setIntegrations] = useState(null)

  useEffect(() => {
    if (identifiers === null || fetchIdentifiers) {
      httpRequest(
        globalState.fetch,
        new URL(`/projects/${projectId}/identifiers`, globalState.baseURL),
        requestOptions
      ).then(({ data, success }) => {
        if (success) {
          setIdentifiers(data)
          setFetchIdentifiers(false)
        } else {
          setErrorMessage(data.toString())
        }
      })
    }
  }, [projectId, fetchIdentifiers])

  useEffect(() => {
    if (integrations === null) {
      httpRequest(
        globalState.fetch,
        new URL('/integrations', globalState.baseURL),
        requestOptions
      ).then(({ data, success }) => {
        if (success) {
          setIntegrations(data.map((elm) => elm.name))
          if (setIntegrationCount !== undefined) {
            setIntegrationCount(data.length)
          }
        }
      })
    }
  }, [])

  return errorMessage ? (
    <Alert className="mt-3" level="error">
      {errorMessage}
    </Alert>
  ) : identifiers === null || integrations === null ? (
    <Loading />
  ) : (
    <IdentifierTable
      integrations={integrations}
      identifiers={identifiers}
      projectId={projectId}
      onChange={() => {
        setFetchIdentifiers(true)
      }}
    />
  )
}
Identifiers.propTypes = {
  project: PropTypes.object.isRequired,
  setIntegrationCount: PropTypes.func
}

export { Identifiers }
