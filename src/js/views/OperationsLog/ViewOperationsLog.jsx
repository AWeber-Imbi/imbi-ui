import React, { Fragment, useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { httpGet } from '../../utils'
import PropTypes from 'prop-types'
import { Markdown, Modal } from '../../components'
import { Error } from '../Error'
import { DateTime } from 'luxon'

function Definition({ term, children, className }) {
  return (
    <Fragment>
      <dt className="font-medium text-gray-500 w-48">{term}</dt>
      <dd
        className={`mt-1 items-start sm:mt-0 truncate ${
          className !== undefined ? className : ''
        }`}>
        {children}
      </dd>
    </Fragment>
  )
}
Definition.propTypes = {
  term: PropTypes.string.isRequired,
  icon: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.element)
  ]),
  className: PropTypes.string
}

function ViewOperationsLog({ operationsLogID, onClose }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [entry, setEntry] = useState()
  const [error, setError] = useState()

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
      <dl className="lg:ml-4 my-3 space-y-3 overflow-hidden text-gray-900">
        <Definition term={t('operationsLog.changeType')}>
          {entry.change_type}
        </Definition>
        <Definition term={t('operationsLog.environment')}>
          {entry.environment}
        </Definition>
        <Definition term={t('operationsLog.recordedAt')}>
          {DateTime.fromISO(entry.recorded_at).toLocaleString(
            DateTime.DATETIME_MED
          )}
        </Definition>
        {entry.completed_at && (
          <Definition term={t('operationsLog.completedAt')}>
            {DateTime.fromISO(entry.completed_at).toLocaleString(
              DateTime.DATETIME_MED
            )}
          </Definition>
        )}
        {entry.description && (
          <Definition term={t('operationsLog.description')}>
            {entry.description}
          </Definition>
        )}
        {(entry.project_name || entry.project_id) && (
          <Definition term={t('operationsLog.project')}>
            {entry.project_name || entry.project_id}
          </Definition>
        )}
        {entry.version && (
          <Definition term={t('operationsLog.version')}>
            {entry.version}
          </Definition>
        )}
        {entry.ticket_slug && (
          <Definition term={t('operationsLog.ticketSlug')}>
            {entry.ticket_slug}
          </Definition>
        )}
        {entry.link && (
          <Definition term={t('operationsLog.link')}>{entry.link}</Definition>
        )}
        {entry.notes && (
          <Definition term={t('operationsLog.notes')}>
            {
              <Markdown className="overflow-auto max-h-[70vh] border-solid border-2 p-2 rounded">
                {entry.notes}
              </Markdown>
            }
          </Definition>
        )}
      </dl>
      <Modal.Footer closeText="Close" onClose={onClose} />
    </Modal>
  )
}
ViewOperationsLog.propTypes = {
  operationsLogID: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
}
export { ViewOperationsLog }
