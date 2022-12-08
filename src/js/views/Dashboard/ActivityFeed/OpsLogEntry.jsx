import { DateTime } from 'luxon'
import Gravatar from 'react-gravatar'
import { Link, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'

function OpsLogEntry({ entry }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const recordedAt = DateTime.fromISO(entry.recorded_at)
  const changeType = entry.change_type.toLowerCase()
  const environment = entry.environment
  const project = entry.project_name
  const description = entry.description
  const version = entry.version
  const displayName = entry.display_name

  const fields = Object.entries(entry)
    .filter(
      ([key, value]) =>
        value && ['project_name', 'description', 'version'].includes(key)
    )
    .map(([key, value]) => key)

  let i18nKey
  if (fields.includes('project_name')) {
    if (fields.includes('version')) {
      i18nKey = 'dashboard.activityFeed.opsLogProjectVersion'
    } else {
      i18nKey = 'dashboard.activityFeed.opsLogProject'
    }
  } else if (fields.includes('description')) {
    if (fields.includes('version')) {
      i18nKey = 'dashboard.activityFeed.opsLogDescriptionVersion'
    } else {
      i18nKey = 'dashboard.activityFeed.opsLogDescription'
    }
  } else if (fields.includes('version')) {
    i18nKey = 'dashboard.activityFeed.opsLogVersion'
  } else {
    i18nKey = 'dashboard.activityFeed.opsLog'
  }

  return (
    <li
      className="cursor-pointer flex p-2 space-x-3"
      onClick={(event) => {
        if (event.target.onclick === null) {
          event.preventDefault()
          navigate(`/ui/operations-log?v=${entry.id}`)
        }
      }}>
      <Gravatar
        className="h-8 w-8 rounded-full"
        default="mp"
        email={entry.email_address}
        size={22}
      />
      <div className="min-w-0 flex-1 text-sm text-gray-700">
        <Trans i18nKey={i18nKey} i18n={i18n} t={t}>
          <span className="font-medium text-gray-700">{{ displayName }}</span>
          <span>{{ description }}</span>
          <span>{{ changeType }}</span>
          <Link
            to={`/ui/projects/${entry.project_id}`}
            className="font-medium text-blue-700 hover:text-blue-800">
            {{ project }}
          </Link>
          <span className="font-medium text-gray-700">{{ environment }}</span>
          <span className="font-medium text-gray-700">{{ version }}</span>
        </Trans>
        <p
          className="mt-0.5 text-sm text-gray-500"
          title={recordedAt.toLocaleString(DateTime.DATETIME_MED)}>
          {recordedAt.toRelative()}
        </p>
      </div>
    </li>
  )
}
OpsLogEntry.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.number.isRequired,
    change_type: PropTypes.string.isRequired,
    environment: PropTypes.string.isRequired,
    recorded_at: PropTypes.string.isRequired,
    email_address: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    project_id: PropTypes.number,
    project_name: PropTypes.string,
    ticket_slug: PropTypes.string,
    link: PropTypes.string,
    description: PropTypes.string,
    version: PropTypes.string
  })
}
export { OpsLogEntry }
