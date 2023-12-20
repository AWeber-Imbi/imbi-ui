import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Context } from '../../state'
import { Error } from '../Error'
import { Display } from './Display'
import { httpDelete } from '../../utils'
import { Button, ConfirmationDialog, Icon, Modal } from '../../components'
import { useTranslation } from 'react-i18next'

function ViewIdentifier({ cachedIdentifier, onDelete }) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)
  const projectId = cachedIdentifier.project_id
  const integrationName = cachedIdentifier.integration_name
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [error, setError] = useState()

  async function onConfirmDelete() {
    const response = await httpDelete(
      globalState.fetch,
      new URL(
        `/projects/${projectId}/identifiers/${integrationName}`,
        globalState.baseURL
      )
    )
    if (response.success) {
      setShowDeleteConfirmation(false)
      if (onDelete) {
        onDelete()
      }
    } else {
      setError(response.data)
    }
  }

  function onDeleteStart() {
    setShowDeleteConfirmation(true)
  }
  function onDeleteEnd() {
    setShowDeleteConfirmation(false)
  }

  if (!cachedIdentifier) return <></>
  if (error) return <Error>{error}</Error>
  return (
    <>
      {showDeleteConfirmation && (
        <ConfirmationDialog
          title={t('project.identifiers.deleteTitle', { integrationName })}
          mode="error"
          onCancel={onDeleteEnd}
          onConfirm={onConfirmDelete}
          confirmationButtonText={t('common.delete')}>
          {t('project.identifiers.deleteConfirmation')}
        </ConfirmationDialog>
      )}
      <Display entry={cachedIdentifier} />
      <Modal.Footer>
        <Button className="btn-red text-s" onClick={onDeleteStart}>
          <Icon icon="fas trash" className="mr-2" />
          {t('common.delete')}
        </Button>
      </Modal.Footer>
    </>
  )
}
ViewIdentifier.propTypes = {
  cachedIdentifier: PropTypes.object,
  onDelete: PropTypes.func
}

export { ViewIdentifier }
