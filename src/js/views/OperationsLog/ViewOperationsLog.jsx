import React, { Fragment, useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { httpGet } from '../../utils'
import PropTypes from 'prop-types'
import { Button, Icon, Modal } from '../../components'
import { Error } from '../Error'
import { Display } from './Display'
import { Edit } from './Edit'

function ViewOperationsLog({ operationsLogID, onClose, onUpdate }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [entry, setEntry] = useState()
  const [error, setError] = useState()
  const [isEditing, setIsEditing] = useState(false)

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

  useEffect(() => {
    loadOpsLog()
  }, [])

  if (!entry) return <></>
  if (error) return <Error>{error}</Error>
  return (
    <Modal onClose={onClose}>
      <Modal.Title>{t('operationsLog.entry')}</Modal.Title>
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
        <Fragment>
          <Display entry={entry} />
          <Modal.Footer closeText="Close" onClose={onClose}>
            <Button
              className="btn-white text-s"
              onClick={() => setIsEditing(true)}>
              <Icon icon="fas edit" className="mr-2" />
              {t('common.edit')}
            </Button>
          </Modal.Footer>
        </Fragment>
      )}
    </Modal>
  )
}
ViewOperationsLog.propTypes = {
  operationsLogID: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}
export { ViewOperationsLog }
