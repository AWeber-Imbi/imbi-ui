import React from 'react'
import PropTypes from 'prop-types'
import { Trans, useTranslation } from 'react-i18next'

function ProjectOpsLogEntry({
  displayName,
  changeType,
  project,
  environment,
  version
}) {
  const { t, i18n } = useTranslation()

  const i18nKey = version ? 'project.feed.opsLogVersion' : 'project.feed.opsLog'

  return (
    <Trans i18nKey={i18nKey} i18n={i18n} t={t}>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ displayName }}
      </span>
      <span>{{ changeType }}</span>
      <span>{{ project }}</span>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ environment }}
      </span>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ version }}
      </span>
    </Trans>
  )
}
ProjectOpsLogEntry.propTypes = {
  displayName: PropTypes.string.isRequired,
  changeType: PropTypes.string.isRequired,
  project: PropTypes.string.isRequired,
  environment: PropTypes.string.isRequired,
  version: PropTypes.string
}
export { ProjectOpsLogEntry }
