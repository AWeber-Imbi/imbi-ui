import React, { useCallback, useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { httpDelete, httpGet } from '../../utils'
import PropTypes from 'prop-types'
import { Button, ConfirmationDialog, Icon, Modal } from '../../components'
import { Error } from '../Error'
import { Display } from './Display'
import { Edit } from './Edit'
import { useNavigate } from 'react-router-dom'

const IGNORE_DURING_DUP = new Set([
  'completed_at',
  'environment',
  'id',
  'occurred_at',
  'recorded_at',
  'recorded_by'
])

function ViewOperationsLog({
  cachedEntry,
  operationsLogID,
  onUpdate,
  onDelete,
  onEditOpen,
  onDeleteOpen,
  onEditClose,
  onDeleteClose
}) {
  const navigate = useNavigate()
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const [entry, setEntry] = useState(cachedEntry)
  const [error, setError] = useState()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  if (cachedEntry && entry && cachedEntry.id !== entry.id) {
    setEntry(cachedEntry)
  }

  function loadOpsLog() {
    const url = new URL(
      `/operations-log/${operationsLogID}`,
      globalState.baseURL
    )
    httpGet(
      globalState.fetch,
      url,
      ({ data }) => {
        if (!data.project_id) {
          setEntry(data)
        } else {
          setEntry({ ...data, project_name: '-' })
          const opsLog = data
          httpGet(
            globalState.fetch,
            new URL(`/projects/${opsLog.project_id}`, globalState.baseURL),
            ({ data }) => {
              setEntry({ ...opsLog, project_name: data.name })
            },
            ({ message }) => setError(message)
          )
        }
      },
      ({ message }) => setError(message)
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

  function onEditStart() {
    setIsEditing(true)
    onEditOpen()
  }

  function onEditEnd() {
    setIsEditing(false)
    onEditClose()
  }

  function onDeleteStart() {
    setShowDeleteConfirmation(true)
    onDeleteOpen()
  }

  function onDeleteEnd() {
    setShowDeleteConfirmation(false)
    onDeleteClose()
  }

  const duplicatesOpsLog = useCallback(() => {
    const url = new URL('/ui/operations-log/create', globalState.baseURL)
    Object.keys(entry)
      .filter((k) => !IGNORE_DURING_DUP.has(k))
      .filter((k) => !!entry[k])
      .forEach((k) => {
        url.searchParams.set(k, entry[k])
      })
    navigate(url, { replace: true })
  }, [entry])

  useEffect(() => {
    if (!cachedEntry) loadOpsLog()
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
          onCancel={() => onDeleteEnd()}
          onConfirm={() => onConfirmDelete()}>
          {t('operationsLog.deleteConfirmation.text')}
        </ConfirmationDialog>
      )}
      {isEditing ? (
        <Edit
          operationsLog={entry}
          onError={(error) => setError(error)}
          onCancel={() => {
            onEditEnd()
          }}
          onSuccess={() => {
            onEditEnd()
            onUpdate()
            loadOpsLog()
          }}
        />
      ) : (
        <>
          <Display entry={entry} />
          <Modal.Footer>
            <Button className="btn-red text-s" onClick={() => onDeleteStart()}>
              <Icon icon="fas trash" className="mr-2" />
              {t('common.delete')}
            </Button>
            <Button
              className="btn-white text-s"
              onClick={() => duplicatesOpsLog()}>
              <Icon icon="fa clone" className="mr-2" />
              Duplicate
            </Button>
            <Button className="btn-white text-s" onClick={() => onEditStart()}>
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
  cachedEntry: PropTypes.object,
  operationsLogID: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditOpen: PropTypes.func.isRequired,
  onDeleteOpen: PropTypes.func.isRequired,
  onEditClose: PropTypes.func.isRequired,
  onDeleteClose: PropTypes.func.isRequired
}
export { ViewOperationsLog }
