import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { httpDelete, httpGet } from '../../utils'
import PropTypes from 'prop-types'
import { Button, ConfirmationDialog, Icon, Modal } from '../../components'
import { Error } from '../Error'
import { Display } from './Display'
import { Edit } from './Edit'

function ViewOperationsLog({ operationsLogID, onUpdate, onDelete }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [entry, setEntry] = useState()
  const [error, setError] = useState()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  function loadOpsLog() {
    const url = new URL(
      `/operations-log/${operationsLogID}`,
      globalState.baseURL
    )
    httpGet(
      globalState.fetch,
      url,
      (data) => {
        if (!data.project_id) {
          setEntry(data)
        } else {
          const opsLog = data
          httpGet(
            globalState.fetch,
            new URL(`/projects/${opsLog.project_id}`, globalState.baseURL),
            (data) => {
              setEntry({ ...opsLog, project_name: data.name })
            },
            (error) => setError(error)
          )
        }
      },
      (error) => setError(error)
    )
  }

  async function onConfirmDelete() {
    const response = await httpDelete(
      globalState.fetch,
      new URL(`/operations-log/${operationsLogID}`, globalState.baseURL)
    )
    if (response.success) {
      setShowDeleteConfirmation(false)
      onDelete(operationsLogID)
    } else {
      setError(response.data)
    }
  }

  useEffect(() => {
    loadOpsLog()
  }, [])

  if (!entry) return <></>
  if (error) return <Error>{error}</Error>
  return (
    <>
      {showDeleteConfirmation && (
        <ConfirmationDialog
          mode="error"
          title={t('operationsLog.deleteConfirmation.title')}
          confirmationButtonText={t('operationsLog.deleteConfirmation.button')}
          onCancel={() => setShowDeleteConfirmation(false)}
          onConfirm={() => onConfirmDelete()}>
          {t('operationsLog.deleteConfirmation.text')}
        </ConfirmationDialog>
      )}
      {isEditing ? (
        <Edit
          saving={false}
          operationsLog={entry}
          onError={(error) => setError(error)}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            onUpdate()
            loadOpsLog()
          }}
        />
      ) : (
        <>
          <Display entry={entry} />
          <Modal.Footer>
            <Button
              className="btn-red text-s"
              onClick={() => setShowDeleteConfirmation(true)}>
              <Icon icon="fas trash" className="mr-2" />
              {t('common.delete')}
            </Button>
            <Button
              className="btn-white text-s"
              onClick={() => setIsEditing(true)}>
              <Icon icon="fas edit" className="mr-2" />
              {t('common.edit')}
            </Button>
          </Modal.Footer>
        </>
      )}
    </>
  )
}
ViewOperationsLog.propTypes = {
  operationsLogID: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}
export { ViewOperationsLog }
