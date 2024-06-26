import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { DescriptionList } from '../../../components/DescriptionList/DescriptionList'
import { Definition } from '../../../components/DescriptionList/Definition'
import { Toggle } from '../../../components/Form/Toggle'
import { DefinitionRow } from '../../../components/DescriptionList/DefinitionRow'
import {
  Button,
  ConfirmationDialog,
  Icon,
  Loading,
  Modal
} from '../../../components'
import { httpDelete } from '../../../utils'
import { Context } from '../../../state'
import { Checkbox } from '../../../components/Form/Checkbox'
import { Error } from '../../Error'

function ViewSSMParam({
  project,
  pathPrefix,
  param,
  showSecureStrings,
  onShowSecureStringsChange,
  onDeleteComplete,
  onDeleteOpen,
  onDeleteClose
}) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const [error, setError] = useState()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteChecklist, setDeleteChecklist] = useState(
    Object.fromEntries(
      Object.entries(param.values).map(([environment]) => [environment, true])
    )
  )

  async function onConfirmDelete() {
    const body = {
      name: param.name.replace(pathPrefix, ''),
      environments: Array.from(
        Object.entries(deleteChecklist)
          .filter(([, value]) => value)
          .map(([environment]) => environment)
      )
    }
    setDeleting(true)
    const response = await httpDelete(
      globalState.fetch,
      new URL(`/projects/${project.id}/configuration/ssm`, globalState.baseURL),
      body
    )
    setDeleting(false)
    if (response.success) {
      setShowDeleteConfirmation(false)
      onDeleteComplete()
    } else {
      setError(
        response?.responseBody?.detail
          ? response.responseBody.detail
          : response.data
      )
    }
  }

  function onDeleteStart() {
    setShowDeleteConfirmation(true)
    onDeleteOpen()
  }

  function onDeleteEnd() {
    setShowDeleteConfirmation(false)
    onDeleteClose()
  }

  function onDeleteCheckboxChange(environment, value) {
    setDeleteChecklist((prevState) => ({
      ...prevState,
      [environment]: value
    }))
  }

  if (error) return <Error>{error}</Error>

  return (
    <>
      {showDeleteConfirmation && (
        <ConfirmationDialog
          mode="error"
          title={t('project.configuration.ssm.deleteConfirmation.title')}
          confirmationButtonText={t(
            'project.configuration.ssm.deleteConfirmation.button'
          )}
          onCancel={() => onDeleteEnd()}
          onConfirm={() => onConfirmDelete()}>
          <fieldset className="space-y-2">
            {deleting ? (
              <Loading />
            ) : (
              Object.keys(param.values)
                .sort()
                .map((environment) => {
                  return (
                    <Checkbox
                      key={environment}
                      name={environment}
                      label={environment}
                      value={deleteChecklist[environment]}
                      onChange={onDeleteCheckboxChange}
                    />
                  )
                })
            )}
          </fieldset>
        </ConfirmationDialog>
      )}
      <DescriptionList>
        <Definition term={t('common.name')}>{param.name}</Definition>
        <Definition term={t('common.type')}>{param.type}</Definition>
      </DescriptionList>
      <div className="flex items-center justify-between mt-6 mb-3">
        <h1 className="text-xl font-medium text-gray-900">Values</h1>
        {param.type.includes('SecureString') && (
          <div className="flex items-center gap-1">
            <p>Show decrypted value</p>
            <Toggle
              onChange={(name, value) => onShowSecureStringsChange(value)}
              name="is-hidden"
              value={showSecureStrings}
            />
          </div>
        )}
      </div>

      <DescriptionList>
        {Object.entries(param.values)
          .sort(([environmentA], [environmentB]) =>
            environmentA > environmentB ? 1 : -1
          )
          .map(([environment, { value, type }]) => {
            return (
              <DefinitionRow
                key={environment}
                className="min-w-0 break-words font-mono"
                term={
                  param.type.includes(',') ? (
                    <>
                      {environment}
                      <br />
                      <i>{type}</i>
                    </>
                  ) : (
                    environment
                  )
                }>
                {type !== 'SecureString' || showSecureStrings
                  ? value
                  : '********'}
              </DefinitionRow>
            )
          })}
      </DescriptionList>
      <Modal.Footer>
        <Button className="btn-red text-s" onClick={() => onDeleteStart()}>
          <Icon icon="fas trash" className="mr-2" />
          {t('common.delete')}
        </Button>
      </Modal.Footer>
    </>
  )
}

ViewSSMParam.propTypes = {
  project: PropTypes.object.isRequired,
  pathPrefix: PropTypes.string.isRequired,
  param: PropTypes.object,
  showSecureStrings: PropTypes.bool.isRequired,
  onShowSecureStringsChange: PropTypes.func.isRequired,
  onDeleteComplete: PropTypes.func.isRequired,
  onDeleteOpen: PropTypes.func.isRequired,
  onDeleteClose: PropTypes.func.isRequired
}

export { ViewSSMParam }
