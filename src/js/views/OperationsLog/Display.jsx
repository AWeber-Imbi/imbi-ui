import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { DateTime } from 'luxon'
import { Icon, Markdown } from '../../components'
import { useTranslation } from 'react-i18next'
import { DescriptionList } from '../../components/DescriptionList/DescriptionList'
import { Definition } from '../../components/DescriptionList/Definition'
import { Context } from '../../state'
import { normalizeTicketSlug } from './NewEntry'

function renderURLTemplate(urlTemplate, slug, environment) {
  return urlTemplate
    .replace('{environment}', environment.toString().toLowerCase())
    .replace('{slug}', slug.toString().toLowerCase())
}

function Display({ entry }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()

  const renderIssueLinks = () => {
    if (!globalState.opsLogURLTemplate) {
      return entry.ticket_slug
    }
    const slugs = normalizeTicketSlug(entry.ticket_slug).split(',')
    return slugs.map((slug, index) => (
      <span key={`${slug}-${index}`}>
        <a
          title={slug}
          target="_blank"
          rel="noreferrer"
          className="text-blue-800 hover:text-blue-700"
          href={renderURLTemplate(
            globalState.opsLogURLTemplate,
            slug,
            entry.environment
          )}>
          {slug}
        </a>
        <React.Fragment>
          {index !== slugs.length - 1 ? ', ' : ''}
        </React.Fragment>
      </span>
    ))
  }

  return (
    <DescriptionList>
      <Definition term={t('operationsLog.recordedBy')}>
        {entry.display_name}
      </Definition>
      <Definition term={t('operationsLog.environment')}>
        {entry.environment}
      </Definition>
      {(entry.project_name || entry.project_id) && (
        <Definition term={t('operationsLog.project')}>
          <a
            className="text-blue-800 hover:text-blue-700"
            href={`/ui/projects/${entry.project_id}`}
            title={entry.project_name}
            target="_blank">
            <Icon icon="fas external-link-alt" className="mr-2" />
            {entry.project_name || entry.project_id}
          </a>
        </Definition>
      )}
      <Definition term={t('operationsLog.changeType')}>
        {entry.change_type}
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
      {entry.version && (
        <Definition term={t('operationsLog.version')}>
          {entry.version}
        </Definition>
      )}
      {entry.ticket_slug && (
        <Definition term={t('operationsLog.ticketSlug')}>
          {renderIssueLinks()}
        </Definition>
      )}
      {entry.link && (
        <Definition term={t('operationsLog.link')}>
          <a
            className="text-blue-800 hover:text-blue-700"
            href={entry.link}
            title={entry.link}
            target="_new">
            <Icon icon="fas external-link-alt" className="mr-2" />
            {entry.link}
          </a>
        </Definition>
      )}
      {entry.notes && (
        <Definition term={t('operationsLog.notes')}>
          <Markdown className="overflow-auto max-h-[30vh] border-solid border-2 p-2 rounded">
            {entry.notes}
          </Markdown>
        </Definition>
      )}
    </DescriptionList>
  )
}
Display.propTypes = {
  entry: PropTypes.object.isRequired
}
export { Display }
