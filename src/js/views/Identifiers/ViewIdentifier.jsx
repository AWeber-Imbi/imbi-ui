import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Context } from '../../state'
import { Error } from '../Error'
import { Display } from './Display'
import { httpDelete } from '../../utils'
import { Button, ConfirmationDialog, Icon, Modal } from '../../components'
import { useTranslation } from 'react-i18next'
import { Edit } from './Edit'

function ViewIdentifier({
  cachedIdentifier,
  integrations,
  onDelete,
  onUpdate
}) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)
  const projectId = cachedIdentifier?.project_id
  const integrationName = cachedIdentifier?.integration_name
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [error, setError] = useState()
  const [isEditing, setIsEditing] = useState(false)

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

  function onEditStart() {
    setIsEditing(true)
  }
  function onEditEnd() {
    setIsEditing(false)
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
      {isEditing ? (
        <Edit
          entry={cachedIdentifier}
          integrations={integrations}
          onError={(error) => setError(error)}
          onCancel={onEditEnd}
          onSuccess={() => {
            onEditEnd()
            onUpdate()
          }}
        />
      ) : (
        <>
          <Display entry={cachedIdentifier} />
          <Modal.Footer>
            <Button className="btn-red text-s" onClick={onDeleteStart}>
              <Icon icon="fas trash" className="mr-2" />
              {t('common.delete')}
            </Button>
            <Button className="btn-white text-s" onClick={onEditStart}>
              <Icon icon="fas edit" className="mr-2" />
              {t('common.edit')}
            </Button>
          </Modal.Footer>
        </>
      )}
    </>
  )
}
ViewIdentifier.propTypes = {
  integrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  cachedIdentifier: PropTypes.object,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

export { ViewIdentifier }
