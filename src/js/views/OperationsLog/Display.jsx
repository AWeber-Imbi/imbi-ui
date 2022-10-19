import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import { DateTime } from 'luxon'
import { Markdown } from '../../components'
import { useTranslation } from 'react-i18next'

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

function Display({ entry }) {
  const { t } = useTranslation()

  return (
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
  )
}
Display.propTypes = {
  entry: PropTypes.object.isRequired
}
export { Display }
